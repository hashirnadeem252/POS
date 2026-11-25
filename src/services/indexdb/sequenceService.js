// src/services/indexdb/sequenceService.js
import { db, STORES } from "./db";

// Row shape: { tenantId, entity: "<entity>_<prefix>", prefix, year, value }
// Primary key: [tenantId+entity], so tenants can never share a counter.
const table = () => db.table(STORES.SEQUENCES);

const seqKey = (entity, prefix) => `${entity}_${prefix}`;

function getPrefix(entity, categoryName) {
  if (entity === "product") {
    if (categoryName && categoryName.length > 0) {
      return categoryName.length >= 3
        ? categoryName.substring(0, 3).toUpperCase()
        : categoryName.toUpperCase();
    }
    return "PRD";
  }
  if (entity === "supplier") return "SUP";
  if (entity === "customer") return "CUS";
  if (entity === "purchase") return "PO";
  if (entity === "salesperson") return "SP";
  if (entity === "grn") return "GRN";
  return "PRD";
}

function formatCode(prefix, year, value) {
  const yearShort = String(year).slice(-2);
  return `${prefix}-${yearShort}-${String(value).padStart(4, "0")}`;
}

// Current counter for this tenant/entity/prefix, reset if the year changed.
async function readSequence(entity, prefix, tenantId) {
  const key = seqKey(entity, prefix);
  const year = new Date().getFullYear();
  const existing = await table().get([tenantId, key]);

  if (!existing || existing.year !== year) {
    return { tenantId, entity: key, prefix, year, value: 0 };
  }
  return existing;
}

// =========================
// GET NEXT SEQUENCE VALUE (preview only, does not save)
// =========================
export async function getNextSequenceValue(entity, categoryName = null, tenantId) {
  if (!tenantId) throw new Error("tenantId is required for sequences");

  const prefix = getPrefix(entity, categoryName);
  const sequence = await readSequence(entity, prefix, tenantId);
  const nextValue = sequence.value + 1;
  const code = formatCode(prefix, sequence.year, nextValue);

  return { code, sequence, nextValue };
}

// =========================
// INCREMENT SEQUENCE (atomic read + write)
// =========================
export async function incrementSequence(entity, categoryName = null, tenantId) {
  if (!tenantId) throw new Error("tenantId is required for sequences");

  const prefix = getPrefix(entity, categoryName);

  return db.transaction("rw", table(), async () => {
    const sequence = await readSequence(entity, prefix, tenantId);
    sequence.value += 1;
    await table().put(sequence);
    return formatCode(prefix, sequence.year, sequence.value);
  });
}

// =========================
// WRAPPER FUNCTIONS (unchanged signatures)
// =========================
export async function getNextProductCode(categoryName = null, tenantId) {
  return (await getNextSequenceValue("product", categoryName, tenantId)).code;
}
export async function saveProductCode(categoryName = null, tenantId) {
  return incrementSequence("product", categoryName, tenantId);
}

export async function getNextSupplierCode(tenantId) {
  return (await getNextSequenceValue("supplier", null, tenantId)).code;
}
export async function saveSupplierCode(tenantId) {
  return incrementSequence("supplier", null, tenantId);
}

export async function getNextCustomerCode(tenantId) {
  return (await getNextSequenceValue("customer", null, tenantId)).code;
}
export async function saveCustomerCode(tenantId) {
  return incrementSequence("customer", null, tenantId);
}

export async function getNextPurchaseCode(tenantId) {
  return (await getNextSequenceValue("purchase", null, tenantId)).code;
}
export async function savePurchaseCode(tenantId) {
  return incrementSequence("purchase", null, tenantId);
}

export async function getNextSalesPersonCode(tenantId) {
  return (await getNextSequenceValue("salesperson", null, tenantId)).code;
}
export async function saveSalesPersonCode(tenantId) {
  return incrementSequence("salesperson", null, tenantId);
}

export async function getNextGRNCode(tenantId) {
  return (await getNextSequenceValue("grn", null, tenantId)).code;
}
export async function saveGRNCode(tenantId) {
  return incrementSequence("grn", null, tenantId);
}