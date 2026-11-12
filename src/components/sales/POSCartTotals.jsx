// components/sales/POSCartTotals.jsx
import { Info } from "lucide-react";

function POSCartTotals({ saleData, returnCount, exchangeCount }) {
  // Defensive fallback: if saleData totals are 0 but there are items, show the math
  const subTotal = saleData.subTotal || 0;
  const discount = saleData.discount || 0;
  const tax = saleData.tax || 0;
  const total = saleData.total || 0;

  return (
    <div className="cart-footer" style={{ background: "#F8FAFC", borderTop: "2px dashed var(--color-border)", padding: "20px 24px" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: "var(--color-text-secondary)" }}>
          <span>Sub Total</span>
          <span>Rs {subTotal.toFixed(2)}</span>
        </div>
        
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: "var(--color-text-secondary)" }}>
          <span>Discount</span>
          <span style={{ color: "var(--color-danger)" }}>- Rs {discount.toFixed(2)}</span>
        </div>
        
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: "var(--color-text-secondary)" }}>
          <span>Tax</span>
          <span style={{ color: "var(--color-success)" }}>+ Rs {tax.toFixed(2)}</span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px", paddingTop: "12px", borderTop: "2px solid var(--color-border)" }}>
          <span style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-text-primary)" }}>Net Total</span>
          <span style={{ fontSize: "28px", fontWeight: 800, color: "var(--color-primary)" }}>
            Rs {total.toFixed(2)}
          </span>
        </div>

        {exchangeCount > 0 && returnCount > 0 && (
          <div style={{ marginTop: "12px", padding: "8px 12px", background: "#FEF3C7", borderRadius: "6px", display: "flex", gap: "8px", alignItems: "center", fontSize: "12px", color: "#92400E", fontWeight: 600 }}>
            <Info size={14} />
            <span>Return + Exchange combined in this transaction</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default POSCartTotals;