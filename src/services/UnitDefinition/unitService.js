// services/UnitDefinition/unitService.js
import { api } from "../apiClient";

const BASE = "/api/Units";

export async function getUnits() {
  return await api.get(BASE);
}

export async function getUnitById(id) {
  return await api.get(`${BASE}/${id}`);
}

export async function createUnit(unit) {
  return await api.post(BASE, unit);
}

export async function updateUnit(id, unit) {
  await api.put(`${BASE}/${id}`, unit);
  return true;
}

export async function deleteUnit(id) {
  await api.delete(`${BASE}/${id}`);
  return true;
}