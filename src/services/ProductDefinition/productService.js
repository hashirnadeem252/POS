// services/ProductDefinition/productService.js
import { api } from "../apiClient";
import {
  saveProductsToIndexedDB,
  getProductsFromIndexedDB,
} from "../indexdb/productService";

const BASE = "/api/Products";

let refreshInterval = null;

// ─────────────────────────────────────────
// HELPER: Sync products to IndexedDB
// ─────────────────────────────────────────
async function syncProductsToIndexedDB(products) {
  try {
    await saveProductsToIndexedDB(products);
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
export async function getProducts(forceRefresh = false) {
  try {
    if (forceRefresh) {
      console.log("🔄 Force refresh: Fetching from API...");
      const products = await api.get(BASE);
      await syncProductsToIndexedDB(products);
      return products;
    }

    // Try IndexedDB first
    try {
      const cached = await getProductsFromIndexedDB();
      if (cached && cached.length > 0) {
        console.log("📁 Products loaded from IndexedDB cache:", cached.length);
        return cached;
      }
    } catch {
      console.log("📁 No cache found, fetching from API...");
    }

    console.log("📡 Fetching products from API...");
    const products = await api.get(BASE);
    await syncProductsToIndexedDB(products);
    return products;
  } catch (error) {
    console.error("❌ Error fetching products:", error);
    // Fallback to IndexedDB if API fails (offline support)
    try {
      const cached = await getProductsFromIndexedDB();
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
  const newProduct = await api.post(BASE, product);
  await refreshProductCache();
  return newProduct;
}

// ─────────────────────────────────────────
// UPDATE PRODUCT
// ─────────────────────────────────────────
export async function updateProduct(id, product) {
  await api.put(`${BASE}/${id}`, product);
  await refreshProductCache();
  return true;
}

// ─────────────────────────────────────────
// DELETE PRODUCT
// ─────────────────────────────────────────
export async function deleteProduct(id) {
  await api.delete(`${BASE}/${id}`);
  await refreshProductCache();
  return true;
}

// ─────────────────────────────────────────
// REFRESH PRODUCT CACHE
// ─────────────────────────────────────────
export async function refreshProductCache() {
  try {
    console.log("🔄 Refreshing product cache...");
    const products = await api.get(BASE);
    await syncProductsToIndexedDB(products);
    console.log("✅ Product cache refreshed:", products.length, "products");
    return products;
  } catch (error) {
    console.error("❌ Failed to refresh product cache:", error);
    throw error;
  }
}

// ─────────────────────────────────────────
// AUTO-REFRESH
// ─────────────────────────────────────────
export function startAutoRefresh(intervalMinutes = 5) {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }

  if (!intervalMinutes || intervalMinutes <= 0) {
    console.warn("⚠️ Invalid interval for auto-refresh, using default 5 minutes");
    intervalMinutes = 5;
  }

  const intervalMs = intervalMinutes * 60 * 1000;

  refreshInterval = setInterval(async () => {
    console.log(`🔄 Auto-refreshing product cache (every ${intervalMinutes} minutes)...`);
    try {
      await refreshProductCache();
    } catch (error) {
      console.error("❌ Auto-refresh failed:", error);
    }
  }, intervalMs);

  console.log(`✅ Auto-refresh started (every ${intervalMinutes} minutes)`);
}

export function stopAutoRefresh() {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
    console.log("⏹️ Auto-refresh stopped");
  } else {
    console.log("ℹ️ No auto-refresh running to stop");
  }
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
  await api.patch(`${BASE}/${productId}/stock`, { currentStock: newStock });
  await refreshProductCache();
  return true;
}