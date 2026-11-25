
const API_BASE = "https://localhost:7219";
const ACCESS_KEY = "pos_auth_token";
const REFRESH_KEY = "pos_refresh_token";
const USER_KEY = "pos_auth_user";

let refreshPromise = null;

async function doRefresh(expectedAccessToken, expectedRefreshToken) {
  const refreshToken = localStorage.getItem(REFRESH_KEY);

  if (!refreshToken) return null;

  if (
    localStorage.getItem(ACCESS_KEY) !== expectedAccessToken ||
    refreshToken !== expectedRefreshToken
  ) {
    return null;
  }

  const res = await fetch(`${API_BASE}/api/Auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) return null;

  const json = await res.json().catch(() => null);
  const data = json?.data ?? json;

  if (!data?.accessToken) return null;

  if (
    localStorage.getItem(ACCESS_KEY) !== expectedAccessToken ||
    localStorage.getItem(REFRESH_KEY) !== refreshToken
  ) {
    return null;
  }

  localStorage.setItem(ACCESS_KEY, data.accessToken);

  if (data.refreshToken) {
    localStorage.setItem(REFRESH_KEY, data.refreshToken);
  }

  if (data.user) {
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  }

  return data.accessToken;
}

function refreshAccessToken(expectedAccessToken, expectedRefreshToken) {
  if (
    refreshPromise?.accessToken === expectedAccessToken &&
    refreshPromise?.refreshToken === expectedRefreshToken
  ) {
    return refreshPromise.promise;
  }

  const promise = doRefresh(
    expectedAccessToken,
    expectedRefreshToken
  ).finally(() => {
    if (refreshPromise?.promise === promise) {
      refreshPromise = null;
    }
  });

  refreshPromise = {
    accessToken: expectedAccessToken,
    refreshToken: expectedRefreshToken,
    promise,
  };

  return promise;
}

export async function apiRequest(path, options = {}) {
  const url = path.startsWith("http")
    ? path
    : `${API_BASE}${path}`;

  const makeRequest = async (token) => {
    const headers = { ...(options.headers || {}) };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const isFormData =
      typeof FormData !== "undefined" &&
      options.body instanceof FormData;

    if (
      options.body &&
      !isFormData &&
      !headers["Content-Type"]
    ) {
      headers["Content-Type"] = "application/json";
    }

    return fetch(url, { ...options, headers });
  };

  let token = localStorage.getItem(ACCESS_KEY);
  let response = await makeRequest(token);

  if (response.status === 401) {
    if (localStorage.getItem(ACCESS_KEY) !== token) {
      throw new Error(
        "Session changed while the request was in progress."
      );
    }

    const refreshToken = localStorage.getItem(REFRESH_KEY);

    const newToken = await refreshAccessToken(
      token,
      refreshToken
    );

    if (!newToken) {
      if (
        localStorage.getItem(ACCESS_KEY) !== token ||
        localStorage.getItem(REFRESH_KEY) !== refreshToken
      ) {
        throw new Error(
          "Session changed while the request was in progress."
        );
      }

      localStorage.removeItem(ACCESS_KEY);
      localStorage.removeItem(REFRESH_KEY);
      localStorage.removeItem(USER_KEY);

      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }

      throw new Error(
        "Session expired. Please log in again."
      );
    }

    if (localStorage.getItem(ACCESS_KEY) !== newToken) {
      throw new Error(
        "Session changed while the request was in progress."
      );
    }

    token = newToken;
    response = await makeRequest(newToken);
  }

  const text = await response.text();

  let json = null;

  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // Response is not JSON
  }

  // Handle expired trial
  if (response.status === 403) {
    const message = (
      json?.message ||
      json?.title ||
      ""
    ).toLowerCase();

    if (
      message.includes("trial has expired") &&
      !window.location.pathname.includes("/billing")
    ) {
      window.location.href = "/billing";
    }
  }

  if (!response.ok) {
    const message =
      json?.message ||
      json?.title ||
      `Request failed (${response.status})`;

    const err = new Error(message);
    err.status = response.status;
    err.body = json;

    throw err;
  }

  if (
    json &&
    typeof json === "object" &&
    "data" in json
  ) {
    return json.data;
  }

  return json;
}

export const api = {
  get: (path, opts = {}) =>
    apiRequest(path, { ...opts, method: "GET" }),

  post: (path, body, opts = {}) =>
    apiRequest(path, {
      ...opts,
      method: "POST",
      body: JSON.stringify(body),
    }),

  put: (path, body, opts = {}) =>
    apiRequest(path, {
      ...opts,
      method: "PUT",
      body: JSON.stringify(body),
    }),

  patch: (path, body, opts = {}) =>
    apiRequest(path, {
      ...opts,
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  delete: (path, opts = {}) =>
    apiRequest(path, { ...opts, method: "DELETE" }),
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
 * Handles authentication and one retry after refresh.
 */
export async function apiRaw(path, options = {}) {
  const url = path.startsWith("http")
    ? path
    : `${API_BASE}${path}`;

  const make = (token) => {
    const headers = { ...(options.headers || {}) };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const isFormData =
      typeof FormData !== "undefined" &&
      options.body instanceof FormData;

    if (
      options.body &&
      !isFormData &&
      !headers["Content-Type"]
    ) {
      headers["Content-Type"] = "application/json";
    }

    return fetch(url, { ...options, headers });
  };

  let token = localStorage.getItem(ACCESS_KEY);
  let response = await make(token);

  if (response.status === 401) {
    const refreshToken = localStorage.getItem(REFRESH_KEY);

    const newToken = await refreshAccessToken(
      token,
      refreshToken
    );

    if (!newToken) {
      throw new Error("Session expired.");
    }

    token = newToken;
    response = await make(newToken);
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");

    const err = new Error(
      `Request failed (${response.status})`
    );

    err.status = response.status;
    err.body = text;

    throw err;
  }

  return response;
}
