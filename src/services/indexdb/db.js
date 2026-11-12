const DB_NAME = "POSSystemDB";
const DB_VERSION = 2;

// =========================
// STORE NAMES
// =========================
export const STORES = {
  SEQUENCES: "sequences",
  PRODUCTS: "products",
  SUPPLIERS: "suppliers",
  CUSTOMERS: "customers",
  SALES_PERSONS: "sales_persons",     // ✅ NEW
  UNITS: "units",
  BRANDS: "brands",
  CATEGORIES: "categories",
};

// =========================
// OPEN DATABASE
// =========================
export function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Create sequences store
      if (!db.objectStoreNames.contains(STORES.SEQUENCES)) {
        const store = db.createObjectStore(STORES.SEQUENCES, { 
          keyPath: "entity" 
        });
        // Example: { entity: "product", prefix: "PRD", year: 2026, value: 0 }
      }

      // Create master data stores (for future sync)
      if (!db.objectStoreNames.contains(STORES.PRODUCTS)) {
        db.createObjectStore(STORES.PRODUCTS, { keyPath: "productId" });
      }
      if (!db.objectStoreNames.contains(STORES.SUPPLIERS)) {
        db.createObjectStore(STORES.SUPPLIERS, { keyPath: "supplierId" });
      }
      if (!db.objectStoreNames.contains(STORES.CUSTOMERS)) {
        db.createObjectStore(STORES.CUSTOMERS, { keyPath: "customerId" });
      }
      if (!db.objectStoreNames.contains(STORES.CATEGORIES)) {
        db.createObjectStore(STORES.CATEGORIES, { keyPath: "categoryId" });
      }
      if (!db.objectStoreNames.contains(STORES.BRANDS)) {
        db.createObjectStore(STORES.BRANDS, { keyPath: "brandId" });
      }
      if (!db.objectStoreNames.contains(STORES.UNITS)) {
        db.createObjectStore(STORES.UNITS, { keyPath: "unitId" });
      }
      if (!db.objectStoreNames.contains(STORES.SALES_PERSONS)) {
        db.createObjectStore(STORES.SALES_PERSONS, { keyPath: "salesPersonId" });
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

// =========================
// GET STORE (Helper)
// =========================
export async function getStore(storeName, mode = "readonly") {
  const db = await openDB();
  const transaction = db.transaction(storeName, mode);
  return transaction.objectStore(storeName);
}

// =========================
// CLOSE DATABASE
// =========================
export function closeDB() {
  return openDB().then(db => {
    db.close();
    console.log("📁 Database closed");
  });
}

// =========================
// CLEAR ALL DATA
// =========================
export async function clearAllData() {
  const db = await openDB();
  const storeNames = Object.values(STORES);
  
  for (const name of storeNames) {
    const transaction = db.transaction(name, "readwrite");
    const store = transaction.objectStore(name);
    store.clear();
    await new Promise((resolve) => {
      transaction.oncomplete = resolve;
    });
  }
  console.log("🗑️ All IndexedDB data cleared");
}