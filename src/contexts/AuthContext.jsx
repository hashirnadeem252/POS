// contexts/AuthContext.jsx
import { createContext, useState, useEffect, useCallback } from "react";
import * as authService from "../services/Auth/authService";

export const AuthContext = createContext(null);

const TOKEN_KEY = "pos_auth_token";
const USER_KEY = "pos_auth_user";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      const savedToken = localStorage.getItem(TOKEN_KEY);
      const savedUser = localStorage.getItem(USER_KEY);

      if (!savedToken) {
        setLoading(false);
        return;
      }

      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          setToken(savedToken);
        } catch {
          localStorage.removeItem(USER_KEY);
        }
      }

      const freshUser = await authService.getCurrentUser(savedToken);

      if (freshUser) {
        setUser(freshUser);
        setToken(savedToken);
        localStorage.setItem(USER_KEY, JSON.stringify(freshUser));
      } else {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setUser(null);
        setToken(null);
      }

      setLoading(false);
    };

    restoreSession();
  }, []);

  const persistSession = (newToken, newUser) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  // ─────────────────────────────────────────
  // LOGIN  — backend returns { accessToken, refreshToken, user, ... }
  // ─────────────────────────────────────────
  const login = useCallback(async (credentials) => {
    const response = await authService.login(credentials);
    const data = response?.data ?? response;

    // Backend uses `accessToken` (not `token`)
    const authToken = data?.accessToken ?? data?.token;

    if (!authToken || !data?.user) {
      console.error("Unexpected login response shape:", response);
      throw new Error("Invalid login response");
    }

    persistSession(authToken, data.user);

    // Store refresh token too — useful later for silent refresh
    if (data.refreshToken) {
      localStorage.setItem("pos_refresh_token", data.refreshToken);
    }

    return data.user;
  }, []);

  // ─────────────────────────────────────────
  // SIGNUP — same shape as login (signup also issues tokens)
  // ─────────────────────────────────────────
  const signup = useCallback(async (payload) => {
    const response = await authService.signup(payload);
    const data = response?.data ?? response;

    const authToken = data?.accessToken ?? data?.token;

    if (!authToken || !data?.user) {
      console.error("Unexpected signup response shape:", response);
      throw new Error("Invalid signup response");
    }

    persistSession(authToken, data.user);

    if (data.refreshToken) {
      localStorage.setItem("pos_refresh_token", data.refreshToken);
    }

    return data.user;
  }, []);

  const logout = useCallback(async () => {
    if (token) {
      await authService.logout(token);
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem("pos_refresh_token");
    setUser(null);
    setToken(null);
  }, [token]);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user && !!token,
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}