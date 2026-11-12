// services/indexdb/customerService.js
import { STORES, getStore } from "./db.js";

export async function saveCustomersToIndexedDB(customers) {
  const store = await getStore(STORES.CUSTOMERS, "readwrite");
  return new Promise((resolve, reject) => {
    let savedCount = 0;
    const transaction = store.transaction;

    transaction.oncomplete = () => {
      console.log(`✅ ${savedCount} customers saved to IndexedDB`);
      resolve(savedCount);
    };
    transaction.onerror = () => reject(transaction.error);

    const clearRequest = store.clear();
    clearRequest.onsuccess = () => {
      console.log("🗑️ Cleared existing customers from IndexedDB");
      if (customers && customers.length > 0) {
        customers.forEach((c) => {
          const req = store.put(c);
          req.onsuccess = () => savedCount++;
          req.onerror = () => reject(req.error);
        });
      } else {
        resolve(0);
      }
    };
    clearRequest.onerror = () => reject(clearRequest.error);
  });
}

export async function getCustomersFromIndexedDB() {
  const store = await getStore(STORES.CUSTOMERS, "readonly");
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function hasCustomersInIndexedDB() {
  const rows = await getCustomersFromIndexedDB();
  return rows && rows.length > 0;
}

export async function clearCustomersFromIndexedDB() {
  const store = await getStore(STORES.CUSTOMERS, "readwrite");
  return new Promise((resolve, reject) => {
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}