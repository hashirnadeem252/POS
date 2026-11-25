// contexts/AuthContext.jsx
import {
  createContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";

import * as authService from "../services/Auth/authService";
import { stopMasterDataAutoSync } from "../services/masterDataSyncService";
import { clearAllData } from "../services/indexdb/db";
import { getAuthTenantId } from "../utils/authTenant";

export const AuthContext = createContext(null);

const TOKEN_KEY = "pos_auth_token";
const USER_KEY = "pos_auth_user";
const REFRESH_TOKEN_KEY = "pos_refresh_token";
const TENANT_KEY = "pos_tenant_id";
const SUBSCRIPTION_KEY = "pos_subscription";

function clearStoredSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(TENANT_KEY);
  localStorage.removeItem(SUBSCRIPTION_KEY);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);

  // Prevent old API requests from updating a newer session.
  const subscriptionRequestId = useRef(0);

  // =========================================
  // FETCH SUBSCRIPTION
  // =========================================
  const fetchSubscription = useCallback(async (authToken) => {
    if (!authToken) return null;
    const requestId = ++subscriptionRequestId.current;

    try {
      const res = await fetch("https://localhost:7219/api/Subscriptions/current", {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (!res.ok) throw new Error(`Subscription API failed: ${res.status}`);

      const response = await res.json();
      const subscriptionData = response?.data?.data ?? response?.data ?? response;

      if (!subscriptionData || typeof subscriptionData !== "object") {
        throw new Error("Invalid subscription response");
      }

      if (requestId !== subscriptionRequestId.current) return null;

      setSubscription(subscriptionData);
      localStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(subscriptionData));
      return subscriptionData;
    } catch (error) {
      console.error("Failed to load subscription:", error);
      return null;
    }
  }, []);

  const refreshSubscription = useCallback(async () => {
    if (!token) return null;
    return await fetchSubscription(token);
  }, [token, fetchSubscription]);

  // =========================================
  // PERSIST SESSION (WITH TENANT GUARD)
  // =========================================
  const persistSession = useCallback(
    (newToken, newUser, refreshToken) => {
      const previousTenantId = localStorage.getItem(TENANT_KEY);
      const newTenantId = getAuthTenantId(newUser);

      //  If tenant changes, force a full reload.
      if (previousTenantId && newTenantId && previousTenantId !== newTenantId) {
        console.warn(`Tenant changed from ${previousTenantId} to ${newTenantId}. Reloading page...`);
        
        clearStoredSession();
        localStorage.setItem(TOKEN_KEY, newToken);
        localStorage.setItem(USER_KEY, JSON.stringify(newUser));
        localStorage.setItem(TENANT_KEY, String(newTenantId));
        if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
        
        window.location.href = "/dashboard"; // Force page reload
        return;
      }

      // Standard login
      subscriptionRequestId.current++;
      setSubscription(null);
      localStorage.removeItem(SUBSCRIPTION_KEY);

      localStorage.setItem(TOKEN_KEY, newToken);
      localStorage.setItem(USER_KEY, JSON.stringify(newUser));

      if (newTenantId) {
        localStorage.setItem(TENANT_KEY, String(newTenantId));
        localStorage.setItem(`pos_tenant_last_login_${newTenantId}`, Date.now());
      }

      if (refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      } else {
        localStorage.removeItem(REFRESH_TOKEN_KEY);
      }

      setToken(newToken);
      setUser(newUser);
      fetchSubscription(newToken);
    },
    [fetchSubscription]
  );

  // =========================================
  // LOGIN & SIGNUP
  // =========================================
  const login = useCallback(async (credentials) => {
    const response = await authService.login(credentials);
    const data = response?.data ?? response;
    const authToken = data?.accessToken ?? data?.token;

    if (!authToken || !data?.user) throw new Error("Invalid login response");
    persistSession(authToken, data.user, data.refreshToken);
    return data.user;
  }, [persistSession]);

  const signup = useCallback(async (payload) => {
    const response = await authService.signup(payload);
    const data = response?.data ?? response;
    const authToken = data?.accessToken ?? data?.token;

    if (!authToken || !data?.user) throw new Error("Invalid signup response");
    persistSession(authToken, data.user, data.refreshToken);
    return data.user;
  }, [persistSession]);

  // =========================================
  // LOGOUT (WITH DB WIPE)
  // =========================================
  const logout = useCallback(async () => {
    const currentTenantId = localStorage.getItem(TENANT_KEY);
    
    try {
      if (token) await authService.logout();
    } finally {
      subscriptionRequestId.current++;
      stopMasterDataAutoSync();
      
      //  Delete this tenant's data from IndexedDB
      if (currentTenantId) {
        try {
          await clearAllData(currentTenantId, { includePendingSales: false });
          console.log(`🧹 Wiped IndexedDB for Tenant ${currentTenantId}`);
        } catch (err) {
          console.error("Failed to clear local DB on logout:", err);
        }
      }

      clearStoredSession();
      setUser(null);
      setToken(null);
      setSubscription(null);
    }
  }, [token]);

  // =========================================
  // RESTORE SESSION
  // =========================================
  useEffect(() => {
    let active = true;

    const restoreSession = async () => {
      const savedToken = localStorage.getItem(TOKEN_KEY);
      const savedUser = localStorage.getItem(USER_KEY);

      if (!savedToken) {
        setSubscription(null);
        localStorage.removeItem(SUBSCRIPTION_KEY);
        setLoading(false);
        return;
      }

      let parsedSavedUser = null;
      if (savedUser) {
        try { parsedSavedUser = JSON.parse(savedUser); } catch { localStorage.removeItem(USER_KEY); }
      }

      try {
        let freshUser;
        try {
          freshUser = await authService.getCurrentUser(savedToken);
        } catch (error) {
          if (parsedSavedUser && typeof navigator !== "undefined" && !navigator.onLine) {
            freshUser = parsedSavedUser;
          } else {
            throw error;
          }
        }

        if (!active) return;

        if (!freshUser) {
          clearStoredSession();
          setUser(null);
          setToken(null);
          setSubscription(null);
          return;
        }

        const tenantId = getAuthTenantId(freshUser);
        if (tenantId) localStorage.setItem(TENANT_KEY, String(tenantId));

        setUser(freshUser);
        setToken(savedToken);
        localStorage.setItem(USER_KEY, JSON.stringify(freshUser));
        fetchSubscription(savedToken);
      } catch (error) {
        console.error("Session restoration failed:", error);
        if (!active) return;
        subscriptionRequestId.current++;
        clearStoredSession();
        setUser(null);
        setToken(null);
        setSubscription(null);
      } finally {
        if (active) setLoading(false);
      }
    };

    restoreSession();
    return () => { active = false; };
  }, [fetchSubscription]);

  // =========================================
  // CROSS-TAB SESSION CHANGE
  // =========================================
  useEffect(() => {
    let reloadRequested = false;
    const reloadForSessionChange = () => {
      if (reloadRequested) return;
      reloadRequested = true;
      stopMasterDataAutoSync();
      window.location.reload();
    };

    const handleStorage = (event) => {
      if (event.storageArea !== localStorage || (event.key !== TOKEN_KEY && event.key !== USER_KEY && event.key !== null)) return;

      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedUserJson = localStorage.getItem(USER_KEY);

      if (!storedToken || !storedUserJson) {
        if (token || user) reloadForSessionChange();
        return;
      }

      let storedUser;
      try { storedUser = JSON.parse(storedUserJson); } catch { reloadForSessionChange(); return; }

      const activeUserId = user?.userId ?? user?.id ?? user?.sub;
      const storedUserId = storedUser?.userId ?? storedUser?.id ?? storedUser?.sub;

      if (
        !token || !user || activeUserId == null || storedUserId == null ||
        String(activeUserId) !== String(storedUserId) ||
        getAuthTenantId(user) !== getAuthTenantId(storedUser)
      ) {
        reloadForSessionChange();
        return;
      }

      setToken(storedToken);
      setUser(storedUser);
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [token, user]);

  // =========================================
  // CONTEXT VALUE
  // =========================================
  const value = {
    user,
    token,
    subscription,
    loading,
    isAuthenticated: !!user && !!token,
    login,
    signup,
    logout,
    refreshSubscription,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}