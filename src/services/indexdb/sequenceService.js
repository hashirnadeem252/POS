// src/services/indexdb/sequenceService.js
import { STORES, getStore } from "./db.js";

// =========================
// GET NEXT SEQUENCE VALUE (Increment only on save)
// =========================
export async function getNextSequenceValue(entity, categoryName = null) {
  let prefix = "PRD";
  
  // Set prefix based on entity
  if (entity === "product") {
    prefix = "PRD";
    if (categoryName && categoryName.length > 0) {
      prefix = categoryName.length >= 3 
        ? categoryName.substring(0, 3).toUpperCase() 
        : categoryName.toUpperCase();
    }
  } else if (entity === "supplier") {
    prefix = "SUP";
  } else if (entity === "customer") {
    prefix = "CUS";
  } else if (entity === "purchase") {
    prefix = "PO";
  } else if (entity === "salesperson") {
    prefix = "SP";
  } else if (entity === "grn") {
    prefix = "GRN";
  }

  const store = await getStore(STORES.SEQUENCES, "readwrite");

  return new Promise((resolve, reject) => {
    const key = `${entity}_${prefix}`;
    const getRequest = store.get(key);

    getRequest.onsuccess = () => {
      let sequence = getRequest.result;
      const currentYear = new Date().getFullYear();

      if (!sequence) {
        sequence = {
          entity: key,
          prefix: prefix,
          year: currentYear,
          value: 0,
        };
      }

      if (sequence.year !== currentYear) {
        sequence.year = currentYear;
        sequence.value = 0;
      }

      const currentValue = sequence.value;
      const nextValue = currentValue + 1;
      
      const yearShort = String(sequence.year).slice(-2);
      const seqNumber = String(nextValue).padStart(4, "0");
      const code = `${prefix}-${yearShort}-${seqNumber}`;

      resolve({
        code: code,
        sequence: sequence,
        nextValue: nextValue,
      });
    };

    getRequest.onerror = () => reject(getRequest.error);
  });
}

// =========================
// INCREMENT SEQUENCE (Call on save)
// =========================
export async function incrementSequence(entity, categoryName = null) {
  let prefix = "PRD";
  
  // Set prefix based on entity
  if (entity === "product") {
    prefix = "PRD";
    if (categoryName && categoryName.length > 0) {
      prefix = categoryName.length >= 3 
        ? categoryName.substring(0, 3).toUpperCase() 
        : categoryName.toUpperCase();
    }
  } else if (entity === "supplier") {
    prefix = "SUP";
  } else if (entity === "customer") {
    prefix = "CUS";
  } else if (entity === "purchase") {
    prefix = "PO";
  } else if (entity === "salesperson") {
    prefix = "SP";
  } else if (entity === "grn") {  // ✅ ADD THIS
    prefix = "GRN";
  }

  const store = await getStore(STORES.SEQUENCES, "readwrite");

  return new Promise((resolve, reject) => {
    const key = `${entity}_${prefix}`;
    const getRequest = store.get(key);

    getRequest.onsuccess = () => {
      let sequence = getRequest.result;
      const currentYear = new Date().getFullYear();

      if (!sequence) {
        sequence = {
          entity: key,
          prefix: prefix,
          year: currentYear,
          value: 0,
        };
      }

      if (sequence.year !== currentYear) {
        sequence.year = currentYear;
        sequence.value = 0;
      }

      // ✅ INCREMENT SEQUENCE
      sequence.value += 1;

      const putRequest = store.put(sequence);

      putRequest.onsuccess = () => {
        const yearShort = String(sequence.year).slice(-2);
        const seqNumber = String(sequence.value).padStart(4, "0");
        const code = `${prefix}-${yearShort}-${seqNumber}`;
        resolve(code);
      };

      putRequest.onerror = () => reject(putRequest.error);
    };

    getRequest.onerror = () => reject(getRequest.error);
  });
}

// =========================
// GET NEXT PRODUCT CODE
// =========================
export async function getNextProductCode(categoryName = null) {
  const result = await getNextSequenceValue("product", categoryName);
  return result.code;
}

export async function saveProductCode(categoryName = null) {
  return await incrementSequence("product", categoryName);
}

// =========================
// GET NEXT SUPPLIER CODE
// =========================
export async function getNextSupplierCode() {
  const result = await getNextSequenceValue("supplier");
  return result.code;
}

export async function saveSupplierCode() {
  return await incrementSequence("supplier");
}

// =========================
// GET NEXT CUSTOMER CODE
// =========================
export async function getNextCustomerCode() {
  const result = await getNextSequenceValue("customer");
  return result.code;
}

export async function saveCustomerCode() {
  return await incrementSequence("customer");
}

// =========================
// PURCHASE SEQUENCES
// =========================
export async function getNextPurchaseCode() {
  const result = await getNextSequenceValue("purchase");
  return result.code;
}

export async function savePurchaseCode() {
  return await incrementSequence("purchase");
}

// =========================
// SALESPERSON SEQUENCES
// =========================
export async function getNextSalesPersonCode() {
  const result = await getNextSequenceValue("salesperson");
  return result.code;
}

export async function saveSalesPersonCode() {
  return await incrementSequence("salesperson");
}

// =========================
// GRN SEQUENCES
// =========================
export async function getNextGRNCode() {
  const result = await getNextSequenceValue("grn");
  return result.code;
}

export async function saveGRNCode() {
  return await incrementSequence("grn");
}