// pages/Customers/CustomersLedger.jsx
import { useState, useEffect } from "react";
import { Wallet, Search, X, CheckCircle2 } from "lucide-react";
import { api } from "../services/apiClient";
import { notify } from "../utils/notify";

export default function CustomersLedger() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadBalances = async () => {
    try {
      const data = await api.get("/api/Customers/balances");
      setCustomers(data || []);
    } catch (err) {
      notify.error("Failed to load Khata data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadBalances(); }, []);

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!paymentAmount || Number(paymentAmount) <= 0) {
      return notify.warning("Please enter a valid amount");
    }

    setIsSubmitting(true);
    try {
      await api.post("/api/Customers/payments", {
        customerId: selectedCustomer.customerId,
        amount: Number(paymentAmount),
        notes: notes.trim() || "Khata payment"
      });
      notify.success("Payment received successfully!");
      setSelectedCustomer(null);
      setPaymentAmount("");
      setNotes("");
      loadBalances();
    } catch (err) {
      notify.error("Failed to record payment");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ FIXED: Safe search that won't crash on null names
  const filtered = customers.filter(c => {
    const searchLower = search.toLowerCase();
    const nameMatch = c.name ? c.name.toLowerCase().includes(searchLower) : false;
    const phoneMatch = c.phone ? c.phone.includes(search) : false;
    return nameMatch || phoneMatch;
  });

  if (loading) {
    return <div style={{ padding: "40px", textAlign: "center" }}>Loading Khata...</div>;
  }

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "24px" }}>
      
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
            <Wallet size={24} color="var(--color-primary)" /> Udhaar Khata
          </h1>
          <p style={{ color: "var(--color-text-secondary)", margin: "4px 0 0 0" }}>Track customer balances and record payments.</p>
        </div>
        <div style={{ position: "relative", width: "300px" }}>
          <Search size={18} style={{ position: "absolute", left: 12, top: 12, color: "var(--color-text-secondary)" }} />
          <input 
            type="text" 
            placeholder="Search by name or phone..." 
            className="input" 
            style={{ paddingLeft: "38px" }} 
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ background: "#F8FAFC", borderBottom: "1px solid var(--color-border-light)" }}>
              <th style={{ padding: "16px", fontSize: "13px", fontWeight: 600 }}>Customer</th>
              <th style={{ padding: "16px", fontSize: "13px", fontWeight: 600 }}>Phone</th>
              <th style={{ padding: "16px", fontSize: "13px", fontWeight: 600, textAlign: "right" }}>Total Udhaar</th>
              <th style={{ padding: "16px", fontSize: "13px", fontWeight: 600, textAlign: "right" }}>Current Balance</th>
              <th style={{ padding: "16px", fontSize: "13px", fontWeight: 600, textAlign: "right" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ padding: "40px", textAlign: "center", color: "var(--color-text-secondary)" }}>
                  No customers found.
                </td>
              </tr>
            ) : filtered.map(c => (
              <tr key={c.customerId} style={{ borderBottom: "1px solid var(--color-border-light)" }}>
                <td style={{ padding: "16px", fontWeight: 600 }}>{c.name || "Unnamed Customer"}</td>
                <td style={{ padding: "16px", color: "var(--color-text-secondary)" }}>{c.phone || "-"}</td>
                
                {/* ✅ FIXED: Safe number formatting */}
                <td style={{ padding: "16px", textAlign: "right", color: "var(--color-danger)" }}>
                  Rs {Number(c.totalCredit || 0).toFixed(2)}
                </td>
                <td style={{ padding: "16px", textAlign: "right", fontWeight: 700, color: Number(c.currentBalance) > 0 ? "var(--color-danger)" : "var(--color-success)" }}>
                  Rs {Number(c.currentBalance || 0).toFixed(2)}
                </td>
                <td style={{ padding: "16px", textAlign: "right" }}>
                  <button 
                    onClick={() => setSelectedCustomer(c)} 
                    className="btn btn-primary btn-sm"
                    disabled={Number(c.currentBalance) <= 0}
                    style={{ opacity: Number(c.currentBalance) <= 0 ? 0.5 : 1 }}
                  >
                    Receive Payment
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ✅ PROFESSIONAL PAYMENT MODAL */}
      {selectedCustomer && (
        <div 
          onClick={() => setSelectedCustomer(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="card" 
            style={{ width: "100%", maxWidth: "420px", position: "relative" }}
          >
            <button 
              onClick={() => setSelectedCustomer(null)} 
              style={{ position: "absolute", top: 16, right: 16, background: "#F1F5F9", border: "none", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <X size={18} />
            </button>

            <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Wallet size={20} color="var(--color-primary)" /> Receive Payment
            </h2>
            
            <div style={{ background: "#F3F5F8", padding: "16px", borderRadius: "8px", marginBottom: "20px" }}>
              <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>{selectedCustomer.name}</div>
              <div style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>Outstanding Balance:</div>
              <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--color-danger)" }}>
                Rs {Number(selectedCustomer.currentBalance || 0).toFixed(2)}
              </div>
            </div>

            <form onSubmit={handlePayment} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label className="auth-label">Amount Received (Rs)</label>
                <input 
                  type="number" 
                  className="input" 
                  style={{ fontSize: "20px", fontWeight: "bold", textAlign: "center" }} 
                  value={paymentAmount} 
                  onChange={e => setPaymentAmount(e.target.value)} 
                  autoFocus
                  max={selectedCustomer.currentBalance}
                />
              </div>
              
              <div>
                <label className="auth-label">Notes (Optional)</label>
                <input 
                  type="text" 
                  className="input" 
                  placeholder="e.g., Paid via JazzCash"
                  value={notes} 
                  onChange={e => setNotes(e.target.value)} 
                />
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                <button type="button" onClick={() => setSelectedCustomer(null)} className="btn btn-outline" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="btn btn-success" style={{ flex: 1, display: "flex", gap: "6px", alignItems: "center", justifyContent: "center" }}>
                  <CheckCircle2 size={16} /> {isSubmitting ? "Processing..." : "Confirm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}