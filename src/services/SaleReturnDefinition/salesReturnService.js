// services/SaleReturnDefinition/salesReturnService.js
import { api } from "../apiClient";

const BASE = "/api/SalesReturn";

// =========================
// GET ALL RETURNS
// =========================
export async function getSalesReturns() {
  return await api.get(BASE);
}

// =========================
// GET RETURN BY ID
// =========================
export async function getSalesReturnById(id) {
  return await api.get(`${BASE}/${id}`);
}

// =========================
// GET RETURNS BY SALE ID
// =========================
export async function getSalesReturnsBySaleId(saleId) {
  return await api.get(`${BASE}/sale/${saleId}`);
}

// =========================
// CREATE SALES RETURN
// =========================
export async function createSalesReturn(salesReturn) {
  return await api.post(BASE, salesReturn);
}

// =========================
// PROCESS RETURN (alias)
// =========================
export async function processReturn(returnData) {
  return createSalesReturn(returnData);
}

// =========================
// UPDATE SALES RETURN
// =========================
export async function updateSalesReturn(id, salesReturn) {
  await api.put(`${BASE}/${id}`, salesReturn);
  return true;
}

// =========================
// DELETE SALES RETURN
// =========================
export async function deleteSalesReturn(id) {
  await api.delete(`${BASE}/${id}`);
  return true;
}