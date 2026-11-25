import { db, STORES } from "./db";
import { normalizeTenantId, requireCurrentAuthTenantId } from "../../utils/authTenant";

const table = () => db.table(STORES.PENDING_SALES);

const resolveTenantId = (tenantId) =>
  tenantId ? normalizeTenantId(tenantId) : requireCurrentAuthTenantId();

const hasNoTenant = (sale) =>
  sale?.tenantId === undefined || sale?.tenantId === null || sale?.tenantId === "";

const newLocalId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `LOCAL-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

/**
 * Tenant-scoped queue of sales created while offline.
 * Same public API as before, so OfflineSyncManager needs no changes.
 */
export const offlineQueue = {
  /** Queues a sale. Returns the new pending count for the tenant. */
  async add(saleData) {
    if (!saleData || typeof saleData !== "object" || Array.isArray(saleData)) {
      throw new TypeError("Sale data must be an object.");
    }
    const tenantId = requireCurrentAuthTenantId();
    if (!tenantId) {
      throw new Error("Cannot queue offline sale: No tenant ID found.");
    }

    await table().add({
      ...saleData,
      tenantId,
      localId: newLocalId(),
      queuedAt: new Date().toISOString(),
    });

    return this.count(tenantId);
  },

  /** Pending sales for the tenant, oldest first. */
  async getAll(tenantIdArg) {
    const tenantId = resolveTenantId(tenantIdArg);
    return table().where("tenantId").equals(tenantId).sortBy("queuedAt");
  },

  /** Rows with no tenantId. getAll() never returns these and they never sync. */
  async getUnassignedCount() {
    return table().filter(hasNoTenant).count();
  },

  /** Removes one sale by localId, only if it belongs to the tenant. */
  async remove(localId, tenantIdArg) {
    const tenantId = resolveTenantId(tenantIdArg);

    await db.transaction("rw", table(), async () => {
      const row = await table().where("localId").equals(localId).first();
      if (row && row.tenantId === tenantId) {
        await table().delete(row.id);
      }
    });

    return this.count(tenantId);
  },

  async count(tenantIdArg) {
    const tenantId = resolveTenantId(tenantIdArg);
    return table().where("tenantId").equals(tenantId).count();
  },

  /** Deletes ALL of the tenant's pending sales. Use with care. */
  async clear(tenantIdArg) {
    const tenantId = resolveTenantId(tenantIdArg);
    await table().where("tenantId").equals(tenantId).delete();
  },
};