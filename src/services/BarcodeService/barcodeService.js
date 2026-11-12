// services/ProductDefinition/barcodeService.js
import { api, apiRaw } from "../apiClient";

const BASE = "/api/Products";

export async function getProductsForBarcode() {
  return await api.get(`${BASE}/barcode`);
}

export async function generateBarcodeLabels(data) {
  const response = await apiRaw(`${BASE}/barcode/generate`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return await response.blob();
}