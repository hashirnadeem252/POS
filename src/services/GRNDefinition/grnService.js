// services/GRNDefinition/grnService.js
import { api } from "../apiClient";

const BASE = "/api/GRN";

export async function getGRNs() {
  return await api.get(BASE);
}

export async function getGRNById(id) {
  return await api.get(`${BASE}/${id}`);
}

export async function createGRN(grn) {
  return await api.post(BASE, grn);
}

export async function updateGRN(id, grn) {
  await api.put(`${BASE}/${id}`, grn);
  return true;
}

export async function deleteGRN(id) {
  await api.delete(`${BASE}/${id}`);
  return true;
}