// pages/EndOfDay.jsx
import { useState, useEffect } from "react";
import { Printer, Calendar, Banknote, CreditCard, Clock, TrendingUp, Wallet, AlertCircle } from "lucide-react";
import { getDailySummary } from "../services/SaleDefinition/saleService";
import { useSettings } from "../contexts/SettingsContext";
import { notify } from "../utils/notify";

export default function EndOfDay() {
  const { settings } = useSettings();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openingCash, setOpeningCash] = useState(0);

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      try {
        const data = await getDailySummary(date);
        setSummary(data);
      } catch (err) {
        notify.error("Failed to load summary");
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, [date]);

  if (loading) return <div style={{ padding: "40px", textAlign: "center" }}>Loading...</div>;
  if (!summary) return null;

  const cashSales = Number(summary.cashSales) || 0;
  const digitalSales = Number(summary.digitalSales) || 0;
  const creditSales = Number(summary.creditSales) || 0;
  const udhaarRecovered = Number(summary.udhaarRecovered) || 0;
  const totalSales = Number(summary.totalSales) || 0;
  const expectedCash = openingCash + cashSales + udhaarRecovered;

  return (
    <>
      {/* ✅ GLOBAL PRINT OVERRIDES - Hides Sidebar, Header, and Buttons */}
      <style>{`
        @media print {
          /* Hide everything on the page */
          body * {
            visibility: hidden;
          }
          /* Show only the print area */
          #print-area, #print-area * {
            visibility: visible;
          }
          /* Position the print area at the top left of the page */
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0;
            margin: 0;
          }
          /* Hide non-printable elements */
          .no-print {
            display: none !important;
          }
          /* Reset card styles for A4 paper */
          .card {
            box-shadow: none !important;
            border: 1px solid #ccc !important;
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "24px" }}>
        
        {/* ✅ SCREEN HEADER (Hidden on Print) */}
        <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: 700, margin: 0, color: "var(--color-text-primary)" }}>End of Day (Z-Report)</h1>
            <p style={{ color: "var(--color-text-secondary)", margin: "4px 0 0 0" }}>Daily summary for {settings.storeName}</p>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <div style={{ position: "relative" }}>
              <Calendar size={18} style={{ position: "absolute", left: 12, top: 12, color: "var(--color-text-secondary)" }} />
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" style={{ paddingLeft: "38px", height: "42px" }} />
            </div>
            <button onClick={() => window.print()} className="btn btn-primary" style={{ height: "42px", display: "flex", gap: "8px" }}>
              <Printer size={18} /> Print Report
            </button>
          </div>
        </div>

        {/* ✅ PRINT AREA (Only this will print) */}
        <div id="print-area">
          
          {/* Print-only Header */}
          <div style={{ display: "none", textAlign: "center", marginBottom: "24px" }} className="print-header">
            <h2 style={{ margin: 0, fontSize: "22px" }}>{settings.storeName}</h2>
            <p style={{ margin: "4px 0", fontSize: "14px" }}>{settings.storeAddress}</p>
            <p style={{ margin: "4px 0", fontSize: "14px" }}>Phone: {settings.storePhone}</p>
            <h3 style={{ marginTop: "16px", fontSize: "18px", borderBottom: "2px solid #000", paddingBottom: "8px" }}>End of Day Report — {new Date(date).toLocaleDateString()}</h3>
          </div>

          {/* Grid Layout */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px" }}>
            
            {/* Payment Methods */}
            <div className="card" style={{ padding: "24px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px", borderBottom: "1px solid var(--color-border-light)", paddingBottom: "12px" }}>Payment Breakdown</h3>
              
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                <span style={{ color: "var(--color-text-secondary)", display: "flex", alignItems: "center", gap: "8px" }}><Banknote size={16}/> Cash Sales</span>
                <span style={{ fontWeight: 600 }}>Rs {cashSales.toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                <span style={{ color: "var(--color-text-secondary)", display: "flex", alignItems: "center", gap: "8px" }}><CreditCard size={16}/> Digital (QR/Card)</span>
                <span style={{ fontWeight: 600 }}>Rs {digitalSales.toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                <span style={{ color: "var(--color-text-secondary)", display: "flex", alignItems: "center", gap: "8px" }}><Clock size={16}/> Udhaar Given</span>
                <span style={{ fontWeight: 600, color: "var(--color-danger)" }}>Rs {creditSales.toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--color-text-secondary)", display: "flex", alignItems: "center", gap: "8px" }}><TrendingUp size={16}/> Udhaar Recovered</span>
                <span style={{ fontWeight: 600, color: "var(--color-success)" }}>+ Rs {udhaarRecovered.toFixed(2)}</span>
              </div>
            </div>

            {/* Totals */}
            <div className="card" style={{ padding: "24px", background: "var(--color-primary-soft)", border: "1px solid var(--color-primary)" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px", borderBottom: "1px solid rgba(13, 148, 136, 0.2)", paddingBottom: "12px", color: "var(--color-primary)" }}>Daily Totals</h3>
              
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ color: "var(--color-text-secondary)" }}>Total Revenue:</span>
                <span style={{ fontWeight: 700, fontSize: "18px" }}>Rs {totalSales.toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ color: "var(--color-text-secondary)" }}>Total Transactions:</span>
                <span style={{ fontWeight: 600 }}>{summary.totalTransactions}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ color: "var(--color-text-secondary)" }}>Total Discounts:</span>
                <span style={{ fontWeight: 600, color: "var(--color-warning)" }}>Rs {Number(summary.totalDiscount).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Cash Drawer Reconciliation */}
          <div className="card" style={{ padding: "24px", border: "2px solid var(--color-success)", background: "#F0FDF4" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "16px", color: "#166534", display: "flex", alignItems: "center", gap: "8px" }}>
              <Wallet size={20} /> Cash Drawer Reconciliation
            </h3>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
              
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "14px" }}>
                  <span>Opening Cash:</span>
                  <span style={{ fontWeight: 600 }}>Rs {openingCash.toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "14px" }}>
                  <span>Cash Sales:</span>
                  <span style={{ fontWeight: 600 }}>+ Rs {cashSales.toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "14px" }}>
                  <span>Udhaar Recovered:</span>
                  <span style={{ fontWeight: 600 }}>+ Rs {udhaarRecovered.toFixed(2)}</span>
                </div>
                
                {/* Opening Cash Input (Screen Only) */}
                <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px", paddingTop: "12px", borderTop: "1px dashed #86EFAC" }}>
                  <span style={{ fontSize: "14px", fontWeight: 600 }}>Set Opening Cash:</span>
                  <input type="number" value={openingCash} onChange={(e) => setOpeningCash(Number(e.target.value) || 0)} className="input" style={{ width: "120px", padding: "6px", textAlign: "right", fontWeight: 600 }} />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "flex-end", borderLeft: "2px dashed #86EFAC", paddingLeft: "24px" }}>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "#166534", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <AlertCircle size={16} /> Expected Cash in Drawer
                </div>
                <div style={{ fontSize: "42px", fontWeight: 800, color: "#166534", lineHeight: 1 }}>
                  Rs {expectedCash.toFixed(2)}
                </div>
                <p style={{ fontSize: "12px", color: "#166534", marginTop: "8px", textAlign: "right" }}>
                  Count the physical cash in the register.
                </p>
              </div>
            </div>
          </div>

          {/* Print-Only Signatures */}
          <div style={{ display: "none", marginTop: "60px" }} className="print-signature">
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ borderTop: "1px solid #000", width: "250px", textAlign: "center", paddingTop: "8px" }}>Cashier Signature</div>
              <div style={{ borderTop: "1px solid #000", width: "250px", textAlign: "center", paddingTop: "8px" }}>Owner Signature</div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}