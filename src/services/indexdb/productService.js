// services/indexdb/productService.js

import { STORES, getStore } from "./db.js";

// =========================
// SAVE PRODUCTS TO INDEXEDDB
// =========================
export async function saveProductsToIndexedDB(products) {
    const store = await getStore(STORES.PRODUCTS, "readwrite");
    
    return new Promise((resolve, reject) => {
        let savedCount = 0;
        const transaction = store.transaction;
        
        transaction.oncomplete = () => {
            console.log(`✅ ${savedCount} products saved to IndexedDB`);
            resolve(savedCount);
        };
        
        transaction.onerror = () => {
            reject(transaction.error);
        };
        
        // Clear existing data first to avoid duplicates
        const clearRequest = store.clear();
        clearRequest.onsuccess = () => {
            console.log('🗑️ Cleared existing products from IndexedDB');
            if (products && products.length > 0) {
                products.forEach((product) => {
                    const request = store.put(product);
                    request.onsuccess = () => {
                        savedCount++;
                    };
                    request.onerror = () => {
                        reject(request.error);
                    };
                });
            } else {
                resolve(0);
            }
        };
        clearRequest.onerror = () => {
            reject(clearRequest.error);
        };
    });
}

// =========================
// GET ALL PRODUCTS FROM INDEXEDDB
// =========================
export async function getProductsFromIndexedDB() {
    const store = await getStore(STORES.PRODUCTS, "readonly");
    
    return new Promise((resolve, reject) => {
        const request = store.getAll();
        
        request.onsuccess = () => {
            resolve(request.result || []);
        };
        
        request.onerror = () => {
            reject(request.error);
        };
    });
}

// =========================
// CHECK IF PRODUCTS EXIST IN INDEXEDDB
// =========================
export async function hasProductsInIndexedDB() {
    const products = await getProductsFromIndexedDB();
    return products && products.length > 0;
}

// =========================
// CLEAR PRODUCTS FROM INDEXEDDB
// =========================
export async function clearProductsFromIndexedDB() {
    const store = await getStore(STORES.PRODUCTS, "readwrite");
    
    return new Promise((resolve, reject) => {
        const request = store.clear();
        
        request.onsuccess = () => {
            console.log("🗑️ Products cleared from IndexedDB");
            resolve();
        };
        
        request.onerror = () => {
            reject(request.error);
        };
    });
}