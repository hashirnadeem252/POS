// services/SupplierDefinition/supplierService.js
import { api } from "../apiClient";

const BASE = "/api/Suppliers";

export async function getSuppliers() {
  return await api.get(BASE);
}

export async function getSupplierById(id) {
  return await api.get(`${BASE}/${id}`);
}

export async function createSupplier(supplier) {
  return await api.post(BASE, supplier);
}

export async function updateSupplier(id, supplier) {
  await api.put(`${BASE}/${id}`, supplier);
  return true;
}

export async function deleteSupplier(id) {
  await api.delete(`${BASE}/${id}`);
  return true;
}
// support for supplier balances and payments
export async function getSupplierBalances() {
  return await api.get("/api/Suppliers/balances");
}

export async function recordSupplierPayment(data) {
  return await api.post("/api/Suppliers/payments", data);
}