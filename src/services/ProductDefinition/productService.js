// services/ProductDefinition/productService.js
import { api, apiRequest } from "../apiClient";
import { db, STORES } from "../indexdb/db";
import {
  saveProductsToIndexedDB,
  getProductsFromIndexedDB,
} from "../indexdb/productService";
import {
  getCurrentAuthTenantId,
  requireCurrentAuthTenantId,
} from "../../utils/authTenant";

const BASE = "/api/Products";

const productRefreshPromises = new Map();

export async function importProductsCsv(csvContent) {
  const formData = new FormData();
  formData.append(
    "file",
    new Blob([csvContent], { type: "text/csv;charset=utf-8" }),
    "products_import.csv"
  );
  return apiRequest(`${BASE}/import`, { method: "POST", body: formData });
}

export const PRODUCTS_UPDATED_EVENT = "pos:products-updated";

function publishProductUpdate(tenantId, products) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(PRODUCTS_UPDATED_EVENT, {
        detail: { tenantId, products },
      })
    );
  }
}

// ─────────────────────────────────────────
// HELPER: Sync products to IndexedDB
// ─────────────────────────────────────────
function assertCurrentTenant(tenantId) {
  if (getCurrentAuthTenantId() !== tenantId) {
    throw new Error("The active shop changed while products were syncing.");
  }
}

async function syncProductsToIndexedDB(products, tenantId) {
  try {
    assertCurrentTenant(tenantId);
    await saveProductsToIndexedDB(products, tenantId);
    publishProductUpdate(tenantId, products);
    console.log("✅ Products synced to IndexedDB:", products.length);
    return products;
  } catch (error) {
    console.error("❌ Failed to sync products to IndexedDB:", error);
    throw error;
  }
}

// ─────────────────────────────────────────
// GET ALL PRODUCTS (with cache)
// ─────────────────────────────────────────
export async function getProducts(
  forceRefresh = false,
  tenantId = requireCurrentAuthTenantId()
) {
  try {
    if (forceRefresh) {
      console.log("🔄 Force refresh: Fetching from API...");
      const products = await api.get(BASE);
      await syncProductsToIndexedDB(products, tenantId);
      return products;
    }

    // Try IndexedDB first
    try {
      const cached = await getProductsFromIndexedDB(tenantId);
      if (cached && cached.length > 0) {
        console.log("📁 Products loaded from IndexedDB cache:", cached.length);
        return cached;
      }
    } catch {
      console.log("📁 No cache found, fetching from API...");
    }

    console.log("📡 Fetching products from API...");
    const products = await api.get(BASE);
    await syncProductsToIndexedDB(products, tenantId);
    return products;
  } catch (error) {
    console.error("❌ Error fetching products:", error);
    // Fallback to IndexedDB if API fails (offline support)
    try {
      const cached = await getProductsFromIndexedDB(tenantId);
      if (cached && cached.length > 0) {
        console.log("📁 Fallback: Using cached products from IndexedDB");
        return cached;
      }
    } catch (e) {
      console.error("❌ Fallback failed:", e);
    }
    throw error;
  }
}

// ─────────────────────────────────────────
// GET PRODUCT BY ID
// ─────────────────────────────────────────
export async function getProductById(id) {
  return await api.get(`${BASE}/${id}`);
}

// ─────────────────────────────────────────
// CREATE PRODUCT
// ─────────────────────────────────────────
export async function createProduct(product) {
  const tenantId = requireCurrentAuthTenantId();
  const newProduct = await api.post(BASE, product);
  assertCurrentTenant(tenantId);
  await refreshProductCache(tenantId);
  return newProduct;
}

// ─────────────────────────────────────────
// UPDATE PRODUCT
// ─────────────────────────────────────────
export async function updateProduct(id, product) {
  const tenantId = requireCurrentAuthTenantId();
  await api.put(`${BASE}/${id}`, product);
  assertCurrentTenant(tenantId);
  await refreshProductCache(tenantId);
  return true;
}

// ─────────────────────────────────────────
// DELETE PRODUCT
// ─────────────────────────────────────────
export async function deleteProduct(id) {
  const tenantId = requireCurrentAuthTenantId();
  await api.delete(`${BASE}/${id}`);
  assertCurrentTenant(tenantId);
  await refreshProductCache(tenantId);
  return true;
}

// ─────────────────────────────────────────
// REFRESH PRODUCT CACHE
// ─────────────────────────────────────────
export async function refreshProductCache(
  tenantId = requireCurrentAuthTenantId()
) {
  const existingRefresh = productRefreshPromises.get(tenantId);
  if (existingRefresh) return existingRefresh;

  const refreshPromise = (async () => {
    try {
      console.log("🔄 Refreshing product cache...");
      const products = await api.get(BASE);
      await syncProductsToIndexedDB(products, tenantId);
      console.log("✅ Product cache refreshed:", products.length, "products");
      return products;
    } catch (error) {
      console.error("❌ Failed to refresh product cache:", error);
      throw error;
    } finally {
      if (productRefreshPromises.get(tenantId) === refreshPromise) {
        productRefreshPromises.delete(tenantId);
      }
    }
  })();

  productRefreshPromises.set(tenantId, refreshPromise);
  return refreshPromise;
}

export async function adjustProductStockInCache(
  stockChanges,
  tenantId = requireCurrentAuthTenantId()
) {
  if (!Array.isArray(stockChanges) || stockChanges.length === 0) return [];

  const quantityByProductId = new Map();
  stockChanges.forEach(({ productId, quantity }) => {
    const id = Number(productId);
    const amount = Number(quantity);
    if (Number.isFinite(id) && Number.isFinite(amount)) {
      quantityByProductId.set(id, (quantityByProductId.get(id) || 0) + amount);
    }
  });

  assertCurrentTenant(tenantId);
  const table = db.table(STORES.PRODUCTS);

  const updatedProducts = await db.transaction("rw", table, async () => {
    const rows = await table.where("tenantId").equals(tenantId).toArray();
    if (rows.length === 0) {
      throw new Error("Cannot update stock because the product cache is empty.");
    }

    const changed = [];
    const next = rows.map((product) => {
      const quantity = quantityByProductId.get(Number(product.productId));
      if (quantity === undefined || !Number.isFinite(Number(product.currentStock))) {
        return product;
      }
      const updated = { ...product, currentStock: Number(product.currentStock) + quantity };
      changed.push(updated);
      return updated;
    });

    if (changed.length > 0) await table.bulkPut(changed);
    return next;
  });

  publishProductUpdate(tenantId, updatedProducts);
  return updatedProducts;
}


// ─────────────────────────────────────────
// LOW STOCK
// ─────────────────────────────────────────
export async function getLowStockProducts() {
  return await api.get(`${BASE}/low-stock`);
}

export async function getLowStockCount() {
  return await api.get(`${BASE}/low-stock/count`);
}

// ─────────────────────────────────────────
// UPDATE STOCK
// ─────────────────────────────────────────
export async function updateProductStock(productId, newStock) {
  const tenantId = requireCurrentAuthTenantId();
  await api.patch(`${BASE}/${productId}/stock`, { currentStock: newStock });
  assertCurrentTenant(tenantId);
  await refreshProductCache(tenantId);
  return true;
}