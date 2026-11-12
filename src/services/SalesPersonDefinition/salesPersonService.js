// services/SalesPersonDefinition/salesPersonService.js
import { api } from "../apiClient";

const BASE = "/api/SalesPersons";

// =========================
// GET ALL SALESPERSONS
// =========================
export async function getSalesPersons() {
  return await api.get(BASE);
}

// =========================
// GET SALESPERSON BY ID
// =========================
export async function getSalesPersonById(id) {
  return await api.get(`${BASE}/${id}`);
}

// =========================
// CREATE SALESPERSON
// =========================
export async function createSalesPerson(salesPerson) {
  return await api.post(BASE, salesPerson);
}

// =========================
// UPDATE SALESPERSON
// =========================
export async function updateSalesPerson(id, salesPerson) {
  await api.put(`${BASE}/${id}`, salesPerson);
  return true;
}

// =========================
// SOFT DELETE SALESPERSON
// =========================
export async function deleteSalesPerson(id) {
  try {
    await api.delete(`${BASE}/${id}`);
    return true;
  } catch (error) {
    // FK constraint → backend responds with 409, or message contains "reference"/"foreign"
    const msg = (error?.message || "").toLowerCase();
    const body = (error?.body?.toString?.() || "").toLowerCase();

    if (
      error.status === 409 ||
      msg.includes("reference") ||
      msg.includes("foreign") ||
      body.includes("reference") ||
      body.includes("foreign")
    ) {
      throw new Error(
        "Cannot delete: Sales person is referenced in other records. Marked as inactive instead."
      );
    }
    throw error;
  }
}

// =========================
// RESTORE SALESPERSON
// =========================
export async function restoreSalesPerson(id) {
  await api.post(`${BASE}/${id}/restore`, {});
  return true;
}

// =========================
// HARD DELETE SALESPERSON
// =========================
export async function hardDeleteSalesPerson(id) {
  await api.delete(`${BASE}/${id}/hard`);
  return true;
}