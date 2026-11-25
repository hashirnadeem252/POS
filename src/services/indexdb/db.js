import Dexie from "dexie";
import { requireCurrentAuthTenantId } from "../../utils/authTenant";

const DB_NAME = "SaleKhataDB";

// Same keys as before, so existing imports keep working.
export const STORES = {
  SEQUENCES: "sequences",
  PRODUCTS: "products",
  SUPPLIERS: "suppliers",
  CUSTOMERS: "customers",
  SALES_PERSONS: "sales_persons",
  UNITS: "units",
  BRANDS: "brands",
  CATEGORIES: "categories",
  PENDING_SALES: "pendingSales",
};

// Per-tenant sync bookkeeping (replaces the localStorage "lastSync" keys).
export const SYNC_STATE = "syncState";

// Server data we cache for offline reading. PENDING_SALES is deliberately
// NOT in this list: it holds unsynced work and must never be bulk-replaced.
export const CACHEABLE_STORES = [
  STORES.PRODUCTS,
  STORES.SUPPLIERS,
  STORES.CUSTOMERS,
  STORES.SALES_PERSONS,
  STORES.UNITS,
  STORES.BRANDS,
  STORES.CATEGORIES,
];

// Compound primary key [tenantId+id] means two tenants can never overwrite
// each other's rows, even if their IDs collide.
const tenantScoped = (idField) => `[tenantId+${idField}], tenantId`;

class PosDatabase extends Dexie {
  constructor() {
    super(DB_NAME);

    this.version(1).stores({
      [STORES.SEQUENCES]: "[tenantId+entity], tenantId",
      [STORES.PRODUCTS]: tenantScoped("productId"),
      [STORES.SUPPLIERS]: tenantScoped("supplierId"),
      [STORES.CUSTOMERS]: tenantScoped("customerId"),
      [STORES.SALES_PERSONS]: tenantScoped("salesPersonId"),
      [STORES.UNITS]: tenantScoped("unitId"),
      [STORES.BRANDS]: tenantScoped("brandId"),
      [STORES.CATEGORIES]: tenantScoped("categoryId"),

      // ++id = auto-increment key, &localId = unique index
      [STORES.PENDING_SALES]: "++id, &localId, tenantId, queuedAt",

      [SYNC_STATE]: "[tenantId+entity], tenantId",
    });

    // Future schema changes go here, never by editing version(1):
    // this.version(2).stores({ [STORES.PENDING_SALES]: "++id, &localId, tenantId, queuedAt, status" })
    //   .upgrade((tx) => tx.table(STORES.PENDING_SALES).toCollection().modify({ status: "pending" }));
  }
}

// One shared instance for the whole app. Dexie opens lazily and keeps the
// connection, so you no longer open/close per call.
export const db = new PosDatabase();

// Dev only: lets you inspect the database from the browser console.
if (import.meta.env.DEV && typeof window !== "undefined") {
  window.db = db;
}

/**
 * Deletes this tenant's local data (e.g. on logout or "clear device").
 * Unsynced sales are KEPT unless includePendingSales is true, because
 * deleting them loses money.
 */
export async function clearAllData(
  tenantId = requireCurrentAuthTenantId(),
  { includePendingSales = false } = {}
) {
  if (!tenantId) return;

  const names = [
    ...Object.values(STORES).filter(
      (name) => includePendingSales || name !== STORES.PENDING_SALES
    ),
    SYNC_STATE,
  ];

  await db.transaction("rw", names.map((n) => db.table(n)), async () => {
    for (const name of names) {
      await db.table(name).where("tenantId").equals(tenantId).delete();
    }
  });
}

/**
 * Removes every OTHER shop's cached master data from this device, so only the
 * logged-in shop's data is kept. Never touches pendingSales (unsynced sales)
 * or sequences (code counters), because deleting those loses real data.
 */
export async function purgeOtherTenantsCache(currentTenantId) {
  if (!currentTenantId) return;

  const names = [...CACHEABLE_STORES, SYNC_STATE];

  await db.transaction("rw", names.map((n) => db.table(n)), async () => {
    for (const name of names) {
      await db
        .table(name)
        .where("tenantId")
        .notEqual(currentTenantId)
        .delete();
    }
  });
}