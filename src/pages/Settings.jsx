// pages/Settings.jsx
import { useState, useEffect } from "react";
import { Save, Store, Phone, Mail, MapPin, Receipt, Percent, DollarSign, CheckCircle2 } from "lucide-react";
import { useSettings } from "../contexts/SettingsContext";
import { updateSettings } from "../services/SettingsDefinition/settingsService";
import { notify } from "../utils/notify";

export default function Settings() {
  const { settings, setSettings } = useSettings();
  const [loading, setLoading] = useState(false);

  // Local form state
  const [form, setForm] = useState({
    storeName: "",
    storeAddress: "",
    storePhone: "",
    storeEmail: "",
    currencySymbol: "Rs",
    currencyCode: "PKR",
    defaultTaxRate: 0,
    receiptHeader: "",
    receiptFooter: "",
    businessType: "Retail",
    taxNumber: "",
    showTaxNumberOnReceipt: true, // Default to true
  });

  // Sync form with context settings when loaded
  useEffect(() => {
    if (settings) {
      setForm({
        storeName: settings.storeName || "",
        storeAddress: settings.storeAddress || "",
        storePhone: settings.storePhone || "",
        storeEmail: settings.storeEmail || "",
        currencySymbol: settings.currencySymbol || "Rs",
        currencyCode: settings.currencyCode || "PKR",
        defaultTaxRate: settings.defaultTaxRate || 0,
        receiptHeader: settings.receiptHeader || "",
        receiptFooter: settings.receiptFooter || "",
        businessType: settings.businessType || "Retail",
        taxNumber: settings.taxNumber || "",
        showTaxNumberOnReceipt: settings.showTaxNumberOnReceipt !== false, // Fallback to true
      });
    }
  }, [settings]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateSettings(form);
      setSettings((prev) => ({ ...prev, ...form }));
      notify.success("Settings updated successfully");
    } catch (error) {
      notify.error(error?.message || "Failed to update settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", paddingBottom: "100px" }}>
      
      <form onSubmit={handleSubmit}>
        {/* ─────────────────────────────────────
            STORE DETAILS CARD
        ───────────────────────────────────── */}
        <div className="card" style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", borderBottom: "1px solid var(--color-border-light)", paddingBottom: "16px" }}>
            <Store size={20} color="var(--color-primary)" />
            <h2 style={{ fontSize: "16px", fontWeight: 600, margin: 0 }}>Store Details</h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <label className="auth-label">Store Name</label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon"><Store size={16} /></span>
                <input name="storeName" className="auth-input" value={form.storeName} onChange={handleChange} required />
              </div>
            </div>

            <div>
              <label className="auth-label">Phone Number</label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon"><Phone size={16} /></span>
                <input name="storePhone" className="auth-input" value={form.storePhone} onChange={handleChange} placeholder="03xx-xxxxxxx" />
              </div>
            </div>

            <div>
              <label className="auth-label">Email Address</label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon"><Mail size={16} /></span>
                <input type="email" name="storeEmail" className="auth-input" value={form.storeEmail} onChange={handleChange} placeholder="store@example.com" />
              </div>
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label className="auth-label">Store Address</label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon"><MapPin size={16} /></span>
                <input name="storeAddress" className="auth-input" value={form.storeAddress} onChange={handleChange} placeholder="Shop #, Street, City" />
              </div>
            </div>

            <div>
              <label className="auth-label">NTN / Tax Number</label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon"><Receipt size={16} /></span>
                <input name="taxNumber" className="auth-input" value={form.taxNumber} onChange={handleChange} placeholder="e.g., 1234567-8" />
              </div>
            </div>

            <div>
              <label className="auth-label">Business Type</label>
              <select name="businessType" className="input" value={form.businessType} onChange={handleChange} style={{ height: "46px" }}>
                <option value="Retail">Retail Shop</option>
                <option value="Restaurant">Restaurant / Cafe</option>
              </select>
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────
            FINANCIAL SETTINGS CARD
        ───────────────────────────────────── */}
        <div className="card" style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", borderBottom: "1px solid var(--color-border-light)", paddingBottom: "16px" }}>
            <Percent size={20} color="var(--color-primary)" />
            <h2 style={{ fontSize: "16px", fontWeight: 600, margin: 0 }}>Financial Settings</h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px" }}>
            <div>
              <label className="auth-label">Currency Symbol</label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon"><DollarSign size={16} /></span>
                <input name="currencySymbol" className="auth-input" value={form.currencySymbol} onChange={handleChange} placeholder="Rs" />
              </div>
            </div>

            <div>
              <label className="auth-label">Currency Code</label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon"><DollarSign size={16} /></span>
                <input name="currencyCode" className="auth-input" value={form.currencyCode} onChange={handleChange} placeholder="PKR" />
              </div>
            </div>

            <div>
              <label className="auth-label">Default Tax Rate (%)</label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon"><Percent size={16} /></span>
                <input type="number" step="0.01" name="defaultTaxRate" className="auth-input" value={form.defaultTaxRate} onChange={handleChange} placeholder="0" />
              </div>
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────
            RECEIPT SETTINGS CARD
        ───────────────────────────────────── */}
        <div className="card" style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", borderBottom: "1px solid var(--color-border-light)", paddingBottom: "16px" }}>
            <Receipt size={20} color="var(--color-primary)" />
            <h2 style={{ fontSize: "16px", fontWeight: 600, margin: 0 }}>Receipt Customization</h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            
            <div style={{ gridColumn: "1 / -1" }}>
              <label className="auth-label">Receipt Header (Optional)</label>
              <input 
                name="receiptHeader" 
                className="input" 
                value={form.receiptHeader} 
                onChange={handleChange} 
                placeholder="Default: Welcome to [Store Name]!" 
              />
              <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginTop: "4px" }}>
                Leave blank to automatically use "Welcome to {form.storeName}".
              </p>
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label className="auth-label">Receipt Footer (Terms & Conditions)</label>
              <textarea 
                name="receiptFooter" 
                className="input" 
                rows="2" 
                value={form.receiptFooter} 
                onChange={handleChange} 
                placeholder="Default: Thank you for shopping with us!" 
                style={{ resize: "vertical" }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "var(--color-background)", padding: "12px", borderRadius: "8px" }}>
              <input 
                type="checkbox" 
                name="showTaxNumberOnReceipt" 
                checked={form.showTaxNumberOnReceipt} 
                onChange={handleChange} 
                style={{ width: "20px", height: "20px", accentColor: "var(--color-primary)", cursor: "pointer" }}
              />
              <label style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)", cursor: "pointer" }}>
                Print NTN / Tax Number
              </label>
            </div>

          </div>
        </div>

        {/* ─────────────────────────────────────
            ✅ STICKY SAVE BUTTON BAR
        ───────────────────────────────────── */}
        <div style={{ 
          position: "fixed", 
          bottom: 0, 
          left: "248px", // Matches sidebar width
          right: 0, 
          background: "#fff", 
          padding: "16px 32px", 
          borderTop: "1px solid var(--color-border-light)",
          display: "flex", 
          justifyContent: "flex-end",
          zIndex: 50,
          boxShadow: "0 -4px 12px rgba(0,0,0,0.05)"
        }}>
          <button 
            type="submit" 
            disabled={loading}
            className="btn btn-primary" 
            style={{ padding: "12px 32px", fontSize: "15px", display: "flex", gap: "8px", alignItems: "center", borderRadius: "8px" }}
          >
            {loading ? "Saving Changes..." : "Save Settings"}
            {!loading && <CheckCircle2 size={18} />}
          </button>
        </div>

      </form>
    </div>
  );
}