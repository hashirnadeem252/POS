// services/Auth/authService.js
import { api, apiRequest } from "../apiClient";

const API_URL = "https://localhost:7219/api/Auth";

export async function signup(data) {
  const response = await fetch(`${API_URL}/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    const msg =
      json?.message ||
      json?.title ||
      (json?.errors && Object.values(json.errors).flat()[0]) ||
      "Signup failed";
    console.error("Signup API Error:", json);
    throw new Error(msg);
  }
  return json?.data ?? json;
}

export async function login(data) {
  const response = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    const msg = json?.message || json?.title || "Invalid credentials";
    console.error("Login API Error:", json);
    throw new Error(msg);
  }
  return json?.data ?? json;
}

// accepts either no arg or an old-style token arg (ignored)
export async function getCurrentUser() {
  try {
    return await api.get("/api/Auth/me");
  } catch (error) {
    if (error.status === 401) return null;
    throw error;
  }
}

// accepts refresh token; falls back to localStorage if omitted
export async function logout(refreshToken) {
  const token = refreshToken || localStorage.getItem("pos_refresh_token");
  try {
    await apiRequest("/api/Auth/logout", {
      method: "POST",
      body: JSON.stringify({ refreshToken: token }),
    });
  } catch (error) {
    console.error("Logout API Error:", error);
  }
  return true;
}