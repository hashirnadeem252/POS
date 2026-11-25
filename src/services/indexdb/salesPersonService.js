// services/indexdb/salesPersonService.js
import { db, STORES } from "./db";
import { masterDataCache } from "./masterDataCache";

export async function saveSalesPersonsToIndexedDB(persons, tenantId) {
  if (!tenantId) return 0;
  const rows = persons || [];
  await masterDataCache.replaceAll(STORES.SALES_PERSONS, rows, tenantId);
  return rows.length;
}

export async function getSalesPersonsFromIndexedDB(tenantId) {
  if (!tenantId) return [];
  return masterDataCache.getAll(STORES.SALES_PERSONS, tenantId);
}

export async function hasSalesPersonsInIndexedDB(tenantId) {
  if (!tenantId) return false;
  const count = await db
    .table(STORES.SALES_PERSONS)
    .where("tenantId")
    .equals(tenantId)
    .count();
  return count > 0;
}

export async function clearSalesPersonsFromIndexedDB(tenantId) {
  if (!tenantId) return;
  await db.table(STORES.SALES_PERSONS).where("tenantId").equals(tenantId).delete();
}