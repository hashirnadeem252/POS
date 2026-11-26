// src/utils/authTenant.js

const USER_KEY = "pos_auth_user";
const TENANT_KEY = "pos_tenant_id";

export function normalizeTenantId(value) {
  if (value == null) return null;

  const tenantId = String(value).trim();
  return /^\d+$/.test(tenantId) && Number(tenantId) > 0 ? tenantId : null;
}

export function getAuthTenantId(user) {
  return normalizeTenantId(user?.tenantId ?? user?.TenantId);
}

export function getCurrentAuthTenantId() {
  if (typeof localStorage === "undefined") return null;

  const storedUser = localStorage.getItem(USER_KEY);
  let userTenantId = null;

  if (storedUser) {
    try {
      userTenantId = getAuthTenantId(JSON.parse(storedUser));
    } catch {
      return null;
    }
  }

  const explicitTenantId = normalizeTenantId(
    localStorage.getItem(TENANT_KEY)
  );

  // The signed-in user is authoritative. A stale or mismatched local marker
  // must never select another shop's cache or queue.
  if (userTenantId) {
    if (explicitTenantId && explicitTenantId !== userTenantId) return null;
    return userTenantId;
  }

  return null;
}

export function requireCurrentAuthTenantId() {
  const tenantId = getCurrentAuthTenantId();
  if (!tenantId) {
    throw new Error("A valid authenticated shop ID is required for local data.");
  }
  return tenantId;
}