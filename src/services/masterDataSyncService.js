import { getBrands } from "./BrandDefinition/brandService";
import { getCategories } from "./CategoryDefinition/categoryService";
import { getCustomers } from "./CustomerDefinition/customerService";
import { refreshProductCache } from "./ProductDefinition/productService";
import { getSalesPersons } from "./SalesPersonDefinition/salesPersonService";
import { getSuppliers } from "./SupplierDefinition/supplierService";
import { getUnits } from "./UnitDefinition/unitService";
import { db, STORES, SYNC_STATE } from "./indexdb/db";
import { masterDataCache } from "./indexdb/masterDataCache";
import {
  getCurrentAuthTenantId,
  normalizeTenantId,
  requireCurrentAuthTenantId,
} from "../utils/authTenant";

const SYNC_INTERVAL_MINUTES = 5;

let syncInterval = null;
let cleanupListeners = null;
let activeTenantId = null;
const syncPromises = new Map();
const lastSyncedAtByTenant = new Map();
const syncStatusByTenant = new Map();

export const MASTER_DATA_UPDATED_EVENT = "pos:master-data-updated";
export const MASTER_DATA_SYNC_STATUS_EVENT = "pos:master-data-sync-status";
export const MASTER_DATA_SYNC_PROGRESS_EVENT = "pos:master-data-sync-progress";

function publishSyncProgress(tenantId, progressData) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(MASTER_DATA_SYNC_PROGRESS_EVENT, {
        detail: { tenantId, ...progressData },
      })
    );
  }
}

const masterDataLoaders = [
  { entity: "customers", store: STORES.CUSTOMERS, load: getCustomers },
  { entity: "salesPersons", store: STORES.SALES_PERSONS, load: getSalesPersons },
  { entity: "suppliers", store: STORES.SUPPLIERS, load: getSuppliers },
  { entity: "categories", store: STORES.CATEGORIES, load: getCategories },
  { entity: "brands", store: STORES.BRANDS, load: getBrands },
  { entity: "units", store: STORES.UNITS, load: getUnits },
];

function publishSyncStatus(tenantId, status, error = null) {
  const lastSyncedAt = lastSyncedAtByTenant.get(tenantId) || null;
  const detail = { tenantId, status, lastSyncedAt, error };
  syncStatusByTenant.set(tenantId, detail);
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(MASTER_DATA_SYNC_STATUS_EVENT, {
        detail,
      })
    );
  }
}

function publishMasterDataUpdate(tenantId, entity, records) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(MASTER_DATA_UPDATED_EVENT, {
        detail: { tenantId, entity, records },
      })
    );
  }
}

export function getMasterDataSyncStatus(
  tenantId = getCurrentAuthTenantId()
) {
  const normalizedTenantId = normalizeTenantId(tenantId);
  if (!normalizedTenantId) {
    return { status: "idle", lastSyncedAt: null };
  }
  return (
    syncStatusByTenant.get(normalizedTenantId) || {
      status: "idle",
      lastSyncedAt: lastSyncedAtByTenant.get(normalizedTenantId) || null,
    }
  );
}

export async function clearMasterDataCache(
  tenantId = requireCurrentAuthTenantId()
) {
  const normalizedTenantId = normalizeTenantId(tenantId);
  if (!normalizedTenantId) {
    throw new Error("A valid shop ID is required to clear its local data.");
  }

  if (activeTenantId === normalizedTenantId) stopMasterDataAutoSync();
  const syncPromise = syncPromises.get(normalizedTenantId);
  if (syncPromise) {
    try {
      await syncPromise;
    } catch (error) {
      console.error("[masterDataSync] Sync failed before clearing tenant cache:", error);
    }
  }

  const storeNames = [
    STORES.PRODUCTS,
    ...masterDataLoaders.map(({ store }) => store),
    SYNC_STATE,
  ];

  await db.transaction("rw", storeNames.map((name) => db.table(name)), async () => {
    for (const name of storeNames) {
      await db.table(name).where("tenantId").equals(normalizedTenantId).delete();
    }
  });

  lastSyncedAtByTenant.delete(normalizedTenantId);
  publishMasterDataUpdate(normalizedTenantId, "products", []);
  masterDataLoaders.forEach(({ entity }) =>
    publishMasterDataUpdate(normalizedTenantId, entity, [])
  );
  publishSyncStatus(normalizedTenantId, "idle");
}

async function saveSnapshot(tenantId, storeName, records) {
  await masterDataCache.replaceAll(storeName, records, tenantId);
}

export function refreshMasterData(
  tenantId = requireCurrentAuthTenantId()
) {
  const normalizedTenantId = normalizeTenantId(tenantId);
  if (!normalizedTenantId) {
    return Promise.reject(new Error("A valid shop ID is required to sync master data."));
  }

  const existingSync = syncPromises.get(normalizedTenantId);
  if (existingSync) return existingSync;

  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return Promise.reject(new Error("Cannot sync master data while offline."));
  }

 const assertCurrentTenant = () => {
    if (getCurrentAuthTenantId() !== normalizedTenantId) {
      throw new Error("The active shop changed while master data was syncing.");
    }
  };

  publishSyncStatus(normalizedTenantId, "syncing");
  
  const syncPromise = (async () => {
    const failures = [];
    let completedCount = 0;
    const totalTasks = 1 + masterDataLoaders.length; // 1 for products + 6 loaders

    // ✅ Helper to emit progress
    const emitProgress = (entityName, status) => {
      completedCount++;
      publishSyncProgress(normalizedTenantId, {
        entity: entityName,
        status,
        percentage: Math.round((completedCount / totalTasks) * 100),
      });
    };

    try {
      // ✅ Fetch Products
      const productResult = await refreshProductCache(normalizedTenantId)
        .then((records) => {
          assertCurrentTenant();
          publishMasterDataUpdate(normalizedTenantId, "products", records);
          emitProgress("products", "success"); // ✅ Emit progress
          return records;
        })
        .catch((error) => {
          failures.push({ entity: "products", error });
          emitProgress("products", "error"); // ✅ Emit progress
          return null;
        });

      // ✅ Fetch Master Data (Customers, Suppliers, etc.)
      const results = await Promise.all(
        masterDataLoaders.map(async ({ entity, store, load }) => {
          try {
            const records = await load();
            if (!Array.isArray(records)) {
              throw new Error(`The ${entity} endpoint returned an invalid response.`);
            }
            assertCurrentTenant();
            await saveSnapshot(normalizedTenantId, store, records);
            publishMasterDataUpdate(normalizedTenantId, entity, records);
            emitProgress(entity, "success"); // ✅ Emit progress
            return records;
          } catch (error) {
            failures.push({ entity, error });
            emitProgress(entity, "error"); // ✅ Emit progress
            return null;
          }
        })
      );

      if (failures.length > 0) {
        const failureMessage = failures
          .map(({ entity, error }) => `${entity}: ${error?.message || "sync failed"}`)
          .join("; ");
        failures.forEach(({ entity, error }) =>
          console.error(`[masterDataSync] Failed to sync ${entity}:`, error)
        );
        publishSyncStatus(normalizedTenantId, "error", failureMessage);
        throw new Error(`Some master data could not be synced: ${failureMessage}`);
      }

      const lastSyncedAt = new Date();
      lastSyncedAtByTenant.set(normalizedTenantId, lastSyncedAt);
      publishSyncStatus(normalizedTenantId, "idle");
      return {
        products: productResult,
        customers: results[0],
        salesPersons: results[1],
        suppliers: results[2],
        categories: results[3],
        brands: results[4],
        units: results[5],
      };
    } finally {
      if (syncPromises.get(normalizedTenantId) === syncPromise) {
        syncPromises.delete(normalizedTenantId);
      }
    }
  })();

  syncPromises.set(normalizedTenantId, syncPromise);
  return syncPromise;
}

export function startMasterDataAutoSync(
  tenantId = requireCurrentAuthTenantId(),
  intervalMinutes = SYNC_INTERVAL_MINUTES
) {
  const normalizedTenantId = normalizeTenantId(tenantId);
  if (!normalizedTenantId) {
    throw new Error("A valid shop ID is required to start master-data sync.");
  }

  stopMasterDataAutoSync();
  activeTenantId = normalizedTenantId;

  const intervalMs =
    (Number.isFinite(intervalMinutes) && intervalMinutes > 0
      ? intervalMinutes
      : SYNC_INTERVAL_MINUTES) *
    60 *
    1000;

  const syncWhenAvailable = () => {
    if (
      typeof navigator === "undefined" ||
      !navigator.onLine ||
      document.visibilityState === "hidden" ||
      getCurrentAuthTenantId() !== normalizedTenantId ||
      ((lastSyncedAtByTenant.get(normalizedTenantId)) &&
        Date.now() - lastSyncedAtByTenant.get(normalizedTenantId).getTime() <
          intervalMs)
    ) {
      return;
    }

    refreshMasterData(normalizedTenantId).catch((error) => {
      console.error("[masterDataSync] Scheduled master-data sync failed:", error);
    });
  };

  const handleOnline = () => syncWhenAvailable();
  const handleVisibilityChange = () => syncWhenAvailable();

  window.addEventListener("online", handleOnline);
  document.addEventListener("visibilitychange", handleVisibilityChange);
  syncInterval = window.setInterval(syncWhenAvailable, intervalMs);
  cleanupListeners = () => {
    window.removeEventListener("online", handleOnline);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  };

  syncWhenAvailable();

  return stopMasterDataAutoSync;
}

export function stopMasterDataAutoSync() {
  if (syncInterval !== null) {
    window.clearInterval(syncInterval);
    syncInterval = null;
  }
  cleanupListeners?.();
  cleanupListeners = null;
  activeTenantId = null;
}