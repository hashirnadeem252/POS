// services/PurchaseDefinition/purchaseService.js
import { api } from "../apiClient";

const BASE = "/api/Purchase";

export async function getPurchases() {
  return await api.get(BASE);
}

export async function getPurchaseById(id) {
  return await api.get(`${BASE}/${id}`);
}

export async function createPurchase(purchase) {
  return await api.post(BASE, purchase);
}

export async function updatePurchase(id, purchase) {
  await api.put(`${BASE}/${id}`, purchase);
  return true;
}

export async function deletePurchase(id) {
  await api.delete(`${BASE}/${id}`);
  return true;
}

export async function updatePurchaseStatus(id, status) {
  return await api.post(`${BASE}/${id}/status`, { status });
}