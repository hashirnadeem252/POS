// src/services/apiClient.js
const API_BASE = "https://localhost:7219";
const ACCESS_KEY = "pos_auth_token";
const REFRESH_KEY = "pos_refresh_token";
const USER_KEY = "pos_auth_user";

let refreshPromise = null;

async function doRefresh() {
  const refreshToken = localStorage.getItem(REFRESH_KEY);
  if (!refreshToken) return null;

  const res = await fetch(`${API_BASE}/api/Auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    return null;
  }

  const json = await res.json().catch(() => null);
  const data = json?.data ?? json;
  if (!data?.accessToken) return null;

  localStorage.setItem(ACCESS_KEY, data.accessToken);
  if (data.refreshToken) localStorage.setItem(REFRESH_KEY, data.refreshToken);
  if (data.user) localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  return data.accessToken;
}

export async function apiRequest(path, options = {}) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;

  const makeRequest = async (token) => {
    const headers = { ...(options.headers || {}) };
    if (token) headers.Authorization = `Bearer ${token}`;
    if (options.body && !headers["Content-Type"]) headers["Content-Type"] = "application/json";
    return fetch(url, { ...options, headers });
  };

  let token = localStorage.getItem(ACCESS_KEY);
  let response = await makeRequest(token);

  if (response.status === 401) {
    refreshPromise = refreshPromise || doRefresh();
    const newToken = await refreshPromise;
    refreshPromise = null;

    if (!newToken) {
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
      throw new Error("Session expired. Please log in again.");
    }
    response = await makeRequest(newToken);
  }

  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    /* non-JSON */
  }

  if (!response.ok) {
    const message = json?.message || json?.title || `Request failed (${response.status})`;
    const err = new Error(message);
    err.status = response.status;
    err.body = json;
    throw err;
  }

  if (json && typeof json === "object" && "data" in json) return json.data;
  return json;
}

export const api = {
  get:    (path, opts = {}) => apiRequest(path, { ...opts, method: "GET" }),
  post:   (path, body, opts = {}) => apiRequest(path, { ...opts, method: "POST",   body: JSON.stringify(body) }),
  put:    (path, body, opts = {}) => apiRequest(path, { ...opts, method: "PUT",    body: JSON.stringify(body) }),
  patch:  (path, body, opts = {}) => apiRequest(path, { ...opts, method: "PATCH",  body: JSON.stringify(body) }),
  delete: (path, opts = {}) => apiRequest(path, { ...opts, method: "DELETE" }),
};

export function getAuthToken() {
  return localStorage.getItem(ACCESS_KEY);
}

export function clearAuth() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * For endpoints returning non-JSON (blobs, files).
 * Handles auth + one retry after refresh.
 */
export async function apiRaw(path, options = {}) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const make = (token) => {
    const headers = { ...(options.headers || {}) };
    if (token) headers.Authorization = `Bearer ${token}`;
    if (options.body && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }
    return fetch(url, { ...options, headers });
  };

  let response = await make(localStorage.getItem(ACCESS_KEY));

  if (response.status === 401) {
    refreshPromise = refreshPromise || doRefresh();
    const newToken = await refreshPromise;
    refreshPromise = null;
    if (!newToken) throw new Error("Session expired.");
    response = await make(newToken);
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    const err = new Error(`Request failed (${response.status})`);
    err.status = response.status;
    err.body = text;
    throw err;
  }
  return response;
}