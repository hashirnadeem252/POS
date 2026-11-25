// services/indexdb/productService.js
import { db, STORES } from "./db";
import { masterDataCache } from "./masterDataCache";

// Replace this tenant's products with fresh server data (atomic).
export async function saveProductsToIndexedDB(products, tenantId) {
  if (!tenantId) throw new Error("TenantId is required to save products.");
  await masterDataCache.replaceAll(STORES.PRODUCTS, products || [], tenantId);
}

export async function getProductsFromIndexedDB(tenantId) {
  if (!tenantId) return [];
  return masterDataCache.getAll(STORES.PRODUCTS, tenantId);
}

export async function hasProductsInIndexedDB(tenantId) {
  if (!tenantId) return false;
  const count = await db
    .table(STORES.PRODUCTS)
    .where("tenantId")
    .equals(tenantId)
    .count();
  return count > 0;
}

export async function clearProductsFromIndexedDB(tenantId) {
  if (!tenantId) return;
  await db.table(STORES.PRODUCTS).where("tenantId").equals(tenantId).delete();
}