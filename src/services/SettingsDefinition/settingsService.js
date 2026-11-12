// services/SettingsDefinition/settingsService.js
import { api } from "../apiClient";

const BASE = "/api/Settings";

export async function getSettings() {
  return await api.get(BASE);
}

export async function updateSettings(data) {
  return await api.put(BASE, data);
}