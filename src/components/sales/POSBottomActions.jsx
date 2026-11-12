// components/sales/POSBottomActions.jsx
import { useEffect } from "react";
import { Pin, X, RotateCcw, CreditCard, Banknote, Clock, List } from "lucide-react";

function POSBottomActions({
  mode,
  saleData,
  setSaleData,
  resetAll,
  processTransaction,
  processReturn,
  handleHold,
  onOpenHeldSales,
}) {
  // Keyboard Shortcuts for Cashiers
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (mode === "sale") {
        if (e.key === "F1") {
          e.preventDefault();
          processTransaction("Cash");
        } else if (e.key === "F2") {
          e.preventDefault();
          processTransaction("Card/QR");
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mode, processTransaction]);

  return (
    <div className="pos-bottom" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", background: "#fff", borderTop: "1px solid var(--color-border)", boxShadow: "0 -4px 12px rgba(0,0,0,0.05)" }}>
      
      {/* Comment / Notes */}
      <div style={{ flex: 1, maxWidth: "400px" }}>
        <input
          type="text"
          className="input"
          placeholder="Add notes (optional)..."
          value={saleData.comments}
          onChange={(e) => setSaleData((prev) => ({ ...prev, comments: e.target.value }))}
          style={{ background: "var(--color-background)", border: "none" }}
        />
      </div>

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        
        {/* ✅ CLEANED: Held / hold / Clear Buttons */}
        <div style={{ display: "flex", gap: "8px", marginRight: "16px" }}>
          <button 
            className="btn btn-outline" 
            onClick={onOpenHeldSales} 
            style={{ height: "52px", padding: "0 20px", borderColor: "#CBD5E1" }}
            title="View Parked Sales"
          >
            <List size={18} /> Parked
          </button>

                   <button 
            className="btn btn-outline" 
            onClick={handleHold} 
            style={{ height: "52px", padding: "0 20px" }}
            title="Hold this sale for later"
          >
            <Pin size={18} /> Hold
          </button>
<button 
  className="btn" 
  onClick={resetAll} 
  style={{ 
    height: "52px", 
    padding: "0 20px", 
    background: "var(--color-danger)", // Solid red
    borderColor: "var(--color-danger)",
    color: "#fff" 
  }}
  title="Clear Cart"
>
  <X size={18} /> Clear
</button>
        </div>

        {/* Payment Buttons */}
        {mode === "return" ? (
          <button className="btn btn-warning" onClick={processReturn} style={{ padding: "0 32px", height: "52px", fontSize: "16px" }}>
            <RotateCcw size={20} /> Process Return
          </button>
        ) : (
          <>
            <button
              className="btn"
              onClick={() => processTransaction("Credit")}
              style={{ height: "52px", padding: "0 24px", fontSize: "16px", background: "#F59E0B", borderColor: "#F59E0B", color: "#fff" }}
            >
              <Clock size={20} /> Udhaar
            </button>

            <button
              className="btn btn-primary"
              onClick={() => processTransaction("Card/QR")}
              style={{ height: "52px", padding: "0 24px", fontSize: "16px", background: "#1E293B", borderColor: "#1E293B" }}
            >
              <CreditCard size={20} /> Digital
            </button>
            
            <button
              className="btn btn-success"
              onClick={() => processTransaction("Cash")}
              style={{ height: "52px", padding: "0 32px", fontSize: "18px", background: "var(--color-primary)", borderColor: "var(--color-primary)" }}
            >
              <Banknote size={22} /> Pay Cash
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default POSBottomActions;