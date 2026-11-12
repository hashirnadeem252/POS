// contexts/SettingsContext.jsx
import { createContext, useState, useEffect, useContext } from "react";
import { getSettings } from "../services/SettingsDefinition/settingsService";

const SettingsContext = createContext(null);

const DEFAULT_SETTINGS = {
  storeName: "Rova",
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
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getSettings();
        if (data) {
          setSettings((prev) => ({ ...prev, ...data }));
        }
      } catch (err) {
        console.warn("Settings load failed, using defaults:", err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, setSettings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside SettingsProvider");
  return ctx;
}