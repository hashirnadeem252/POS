// components/suppliers/PaySupplierModal.jsx
import { useState } from "react";
import { X, DollarSign, CheckCircle2 } from "lucide-react";
import { recordSupplierPayment } from "../../services/SupplierDefinition/supplierService";
import { notify } from "../../utils/notify";

export default function PaySupplierModal({ isOpen, onClose, supplier, onSuccess }) {
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen || !supplier) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return notify.warning("Enter a valid amount");

    setLoading(true);
    try {
      await recordSupplierPayment({
        supplierId: supplier.supplierId,
        amount: Number(amount),
        notes: notes.trim(),
      });
      notify.success("Payment recorded successfully!");
      onSuccess();
      onClose();
      setAmount("");
      setNotes("");
    } catch (err) {
      notify.error(err.message || "Failed to record payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000 }}>
      <div style={{ background: "#fff", borderRadius: "16px", width: "100%", maxWidth: "400px", padding: "24px", boxShadow: "0 24px 48px rgba(0,0,0,0.2)" }}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
            <DollarSign size={22} color="#10B981" /> Pay Supplier
          </h2>
          <button onClick={onClose} style={{ background: "#F1F5F9", border: "none", width: 32, height: 32, borderRadius: "50%", cursor: "pointer" }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ background: "#F3F5F8", padding: "12px", borderRadius: "8px", marginBottom: "20px", fontSize: "14px" }}>
          <div style={{ fontWeight: 600, marginBottom: "4px" }}>{supplier.name}</div>
          <div style={{ fontSize: "12px", color: "#6B7A8F" }}>Current Payable:</div>
          <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--color-danger)", marginTop: "2px" }}>
            Rs {Number(supplier.currentBalance || 0).toFixed(2)}
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px" }}>Amount to Pay</label>
            <input
              type="number"
              autoFocus
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input"
              placeholder="Enter amount"
              style={{ fontSize: "20px", fontWeight: "bold", padding: "14px", textAlign: "center" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px" }}>Notes (Optional)</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input"
              placeholder="e.g., Cash payment"
            />
          </div>
          <button type="submit" disabled={loading} className="btn btn-success" style={{ padding: "14px", fontSize: "16px", display: "flex", gap: "8px", justifyContent: "center" }}>
            <CheckCircle2 size={20} /> {loading ? "Processing..." : "Confirm Payment"}
          </button>
        </form>
      </div>
    </div>
  );
}