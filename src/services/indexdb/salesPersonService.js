// services/indexdb/salesPersonService.js
import { STORES, getStore } from "./db.js";

export async function saveSalesPersonsToIndexedDB(persons) {
  const store = await getStore(STORES.SALES_PERSONS, "readwrite");
  return new Promise((resolve, reject) => {
    let savedCount = 0;
    const transaction = store.transaction;

    transaction.oncomplete = () => {
      console.log(`✅ ${savedCount} sales persons saved to IndexedDB`);
      resolve(savedCount);
    };
    transaction.onerror = () => reject(transaction.error);

    const clearRequest = store.clear();
    clearRequest.onsuccess = () => {
      console.log("🗑️ Cleared existing sales persons from IndexedDB");
      if (persons && persons.length > 0) {
        persons.forEach((p) => {
          const req = store.put(p);
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

export async function getSalesPersonsFromIndexedDB() {
  const store = await getStore(STORES.SALES_PERSONS, "readonly");
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function hasSalesPersonsInIndexedDB() {
  const rows = await getSalesPersonsFromIndexedDB();
  return rows && rows.length > 0;
}

export async function clearSalesPersonsFromIndexedDB() {
  const store = await getStore(STORES.SALES_PERSONS, "readwrite");
  return new Promise((resolve, reject) => {
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}