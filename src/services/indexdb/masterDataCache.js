import { db, CACHEABLE_STORES, SYNC_STATE } from "./db";
import { normalizeTenantId, requireCurrentAuthTenantId } from "../../utils/authTenant";

const resolveTenantId = (tenantId) =>
  tenantId ? normalizeTenantId(tenantId) : requireCurrentAuthTenantId();

function assertCacheable(storeName) {
  if (!CACHEABLE_STORES.includes(storeName)) {
    // Protects pendingSales: replaceAll() on it would delete unsynced sales.
    throw new Error(`"${storeName}" is not a cacheable store.`);
  }
}

/**
 * Local copy of server master data (products, customers, ...).
 * Same API as the native version, so cachedFetch.js works unchanged.
 */
export const masterDataCache = {
  /** Atomically replaces this tenant's rows in a store with fresh server data. */
  async replaceAll(storeName, rows, tenantIdArg) {
    assertCacheable(storeName);
    const tenantId = resolveTenantId(tenantIdArg);
    const store = db.table(storeName);
    const syncState = db.table(SYNC_STATE);

    await db.transaction("rw", store, syncState, async () => {
      await store.where("tenantId").equals(tenantId).delete();
      await store.bulkPut(rows.map((row) => ({ ...row, tenantId })));
      await syncState.put({
        tenantId,
        entity: storeName,
        lastSyncedAt: new Date().toISOString(),
      });
    });
  },

  async getAll(storeName, tenantIdArg) {
    assertCacheable(storeName);
    const tenantId = resolveTenantId(tenantIdArg);
    return db.table(storeName).where("tenantId").equals(tenantId).toArray();
  },

  /** ISO timestamp of the last successful refresh, or null. Now async. */
  async lastSyncedAt(storeName, tenantIdArg) {
    const tenantId = resolveTenantId(tenantIdArg);
    const row = await db.table(SYNC_STATE).get([tenantId, storeName]);
    return row?.lastSyncedAt ?? null;
  },
};