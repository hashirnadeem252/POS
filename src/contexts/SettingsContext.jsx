// contexts/SettingsContext.jsx
import { createContext, useState, useEffect, useContext, useCallback } from "react";
import { getSettings } from "../services/SettingsDefinition/settingsService";
import { useAuth } from "../hooks/auth/useAuth"; // ✅ Import useAuth

const SettingsContext = createContext(null);

const DEFAULT_SETTINGS = {
  storeName: "SaleKhata",
  storeAddress: null,
  storePhone: null,
  storeEmail: null,
  storeLogoUrl: null,
  currencySymbol: "Rs",
  currencyCode: "PKR",
  defaultTaxRate: 0,
  receiptFooter: null,
  businessType: "Retail",
};

export function SettingsProvider({ children }) {
  const { user } = useAuth(); // ✅ Get the user to watch for login/logout
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  // ✅ Wrap in useCallback so it can be called from outside
  const refreshSettings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSettings();
      if (data) {
        setSettings((prev) => ({ ...prev, ...data }));
      } else {
        setSettings(DEFAULT_SETTINGS);
      }
    } catch (err) {
      console.warn("Settings load failed, using defaults:", err.message);
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ Re-fetch whenever the user changes (login, logout, signup)
  useEffect(() => {
    refreshSettings();
  }, [user, refreshSettings]);

  const formatCurrency = (amount) => {
    const symbol = settings.currencySymbol || "Rs";
    return `${symbol} ${Number(amount || 0).toFixed(2)}`;
  };

  return (
    <SettingsContext.Provider value={{ settings, setSettings, loading, formatCurrency, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside SettingsProvider");
  return ctx;
}