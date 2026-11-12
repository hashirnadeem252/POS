// services/CategoryDefinition/categoryService.js
import { api } from "../apiClient";

const BASE = "/api/Categories";

export async function getCategories() {
  return await api.get(BASE);
}

export async function getCategoryById(id) {
  return await api.get(`${BASE}/${id}`);
}

export async function createCategory(category) {
  return await api.post(BASE, category);
}

export async function updateCategory(id, category) {
  await api.put(`${BASE}/${id}`, category);
  return true;
}

export async function deleteCategory(id) {
  await api.delete(`${BASE}/${id}`);
  return true;
}