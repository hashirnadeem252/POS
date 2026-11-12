// components/sales/QuickAddModal.jsx
import { useState } from "react";
import { X, UserPlus, Save } from "lucide-react";
import { createCustomer } from "../../services/CustomerDefinition/customerService";
import { createSalesPerson } from "../../services/SalesPersonDefinition/salesPersonService";
import { notify } from "../../utils/notify";

export default function QuickAddModal({ isOpen, onClose, type, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", code: "" });

  if (!isOpen) return null;

  const isCustomer = type === "customer";
  const title = isCustomer ? "Quick Add Customer" : "Quick Add Sales Person";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return notify.warning("Name is required");

    setLoading(true);
    try {
      let result;
      if (isCustomer) {
        // Generate a simple code if not provided
        const code = form.code || `C-${Date.now().toString().slice(-6)}`;
        result = await createCustomer({ ...form, code, isActive: true, openingBalance: 0 });
      } else {
        const code = form.code || `SP-${Date.now().toString().slice(-6)}`;
        result = await createSalesPerson({ ...form, code, isActive: true, commissionPercentage: 0 });
      }
      
      notify.success(`${isCustomer ? "Customer" : "Sales Person"} added!`);
      onSuccess(result); // Pass the new customer/person back to the POS
      onClose();
      setForm({ name: "", phone: "", code: "" });
    } catch (err) {
      notify.error(err.message || "Failed to add record");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000 }}>
      <div style={{ background: "#fff", borderRadius: "16px", width: "100%", maxWidth: "400px", padding: "24px", boxShadow: "0 24px 48px rgba(0,0,0,0.2)" }}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
            <UserPlus size={20} color="#0D9488" /> {title}
          </h2>
          <button onClick={onClose} style={{ background: "#F1F5F9", border: "none", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Full Name *</label>
            <input autoFocus className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g., Ali Khan" />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Phone Number</label>
            <input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="03xx-xxxxxxx" />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Code (Optional)</label>
            <input className="input" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="Auto-generated if empty" />
          </div>
          
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ marginTop: "8px", padding: "12px", display: "flex", justifyContent: "center", gap: "8px" }}>
            <Save size={18} /> {loading ? "Saving..." : "Save & Select"}
          </button>
        </form>

      </div>
    </div>
  );
}