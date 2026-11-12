// services/CustomerDefinition/customerService.js
import { api } from "../apiClient";

const BASE = "/api/Customers";

export async function getCustomers() {
  return await api.get(BASE);
}

export async function getCustomerById(id) {
  return await api.get(`${BASE}/${id}`);
}

export async function createCustomer(customer) {
  return await api.post(BASE, customer);
}

export async function updateCustomer(id, customer) {
  await api.put(`${BASE}/${id}`, customer);
  return true;
}

export async function deleteCustomer(id) {
  await api.delete(`${BASE}/${id}`);
  return true;
}