// services/indexdb/customerService.js
import { db, STORES } from "./db";
import { masterDataCache } from "./masterDataCache";

export async function saveCustomersToIndexedDB(customers, tenantId) {
  if (!tenantId) return 0;
  const rows = customers || [];
  await masterDataCache.replaceAll(STORES.CUSTOMERS, rows, tenantId);
  return rows.length;
}

export async function getCustomersFromIndexedDB(tenantId) {
  if (!tenantId) return [];
  return masterDataCache.getAll(STORES.CUSTOMERS, tenantId);
}

export async function hasCustomersInIndexedDB(tenantId) {
  if (!tenantId) return false;
  const count = await db
    .table(STORES.CUSTOMERS)
    .where("tenantId")
    .equals(tenantId)
    .count();
  return count > 0;
}

export async function clearCustomersFromIndexedDB(tenantId) {
  if (!tenantId) return;
  await db.table(STORES.CUSTOMERS).where("tenantId").equals(tenantId).delete();
}