import { api } from "../apiClient";

const BASE = "/api/Users";

export async function getUsers() {
  return await api.get(BASE);
}

export async function createUser(data) {
  return await api.post(BASE, data);
}

export async function toggleUserActive(id) {
  return await api.patch(`${BASE}/${id}/toggle-active`, {});
}