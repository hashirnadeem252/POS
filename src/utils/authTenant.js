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

  // ✅ Priority 1: Read from pos_tenant_id (set explicitly by AuthContext)
  const explicitTenantId = localStorage.getItem(TENANT_KEY);
  const normalizedExplicit = normalizeTenantId(explicitTenantId);
  if (normalizedExplicit) return normalizedExplicit;

  // Priority 2: Fallback to pos_auth_user
  const storedUser = localStorage.getItem(USER_KEY);
  if (!storedUser) return null;

  try {
    return getAuthTenantId(JSON.parse(storedUser));
  } catch {
    return null;
  }
}

export function requireCurrentAuthTenantId() {
  const tenantId = getCurrentAuthTenantId();
  if (!tenantId) {
    throw new Error("A valid authenticated shop ID is required for local data.");
  }
  return tenantId;
}