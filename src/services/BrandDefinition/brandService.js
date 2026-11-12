// services/BrandDefinition/brandService.js
import { api } from "../apiClient";

const BASE = "/api/Brands";

export async function getBrands() {
  return await api.get(BASE);
}

export async function getBrandById(id) {
  return await api.get(`${BASE}/${id}`);
}

export async function createBrand(brand) {
  return await api.post(BASE, brand);
}

export async function updateBrand(id, brand) {
  await api.put(`${BASE}/${id}`, brand);
  return true;
}

export async function deleteBrand(id) {
  await api.delete(`${BASE}/${id}`);
  return true;
}