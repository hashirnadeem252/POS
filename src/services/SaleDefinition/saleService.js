// services/SaleDefinition/saleService.js
import { api } from "../apiClient";

const BASE = "/api/Sales";
const RETURNS_BASE = "/api/SalesReturn";

// =========================
// GET ALL SALES
// =========================
export async function getSales() {
  return await api.get(BASE);
}

// =========================
// GET SALE BY ID
// =========================
export async function getSaleById(id) {
  return await api.get(`${BASE}/${id}`);
}
// =========================
// GET HELD SALES (DRAFTS)
// =========================
export async function getHeldSales() {
  const allSales = await api.get("/api/Sales");
  // Filter for sales that were held
  return allSales.filter(s => s.status === "Draft");
}
//get dailysummary for sales 
export async function getDailySummary(dateString) {
  return await api.get(`/api/Sales/daily-summary?date=${dateString}`);
}
// =========================
// CREATE SALE
// =========================
export async function createSale(sale) {
  return await api.post(BASE, sale);
}

// =========================
// UPDATE SALE
// =========================
export async function updateSale(id, sale) {
  await api.put(`${BASE}/${id}`, sale);
  return true;
}

// =========================
// DELETE SALE
// =========================
export async function deleteSale(id) {
  await api.delete(`${BASE}/${id}`);
  return true;
}

// =========================
// GET SALE BY INVOICE NUMBER
// (returns null on 404 — matches old behavior)
// =========================
export async function getSaleByInvoiceNumber(invoiceNumber) {
  try {
    return await api.get(`${BASE}/by-invoice/${invoiceNumber}`);
  } catch (error) {
    if (error.status === 404) return null;
    throw error;
  }
}

// =========================
// PROCESS RETURN (POST to SalesReturn API)
// =========================
export async function returnSale(returnData) {
  return await api.post(RETURNS_BASE, returnData);
}

// =========================
// SEARCH SALES
// Supports both patterns:
//   searchSales(filters)        → POST /search with JSON body
//   searchSales(filters, 'GET') → GET /search?query
// Default is POST (matches the second file you pasted).
// =========================
export async function searchSales(filters, mode = "POST") {
  if (mode === "GET") {
    const queryParams = new URLSearchParams();
    Object.keys(filters || {}).forEach((key) => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== "") {
        queryParams.append(key, filters[key]);
      }
    });
    return await api.get(`${BASE}/search?${queryParams.toString()}`);
  }

  // Default: POST body
  return await api.post(`${BASE}/search`, filters);
}

// =========================
// GET SALE DETAILS (for search drawer)
// =========================
export async function getSaleDetails(id) {
  return await api.get(`${BASE}/${id}/details`);
}