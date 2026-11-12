// components/sales/HeldSalesModal.jsx
import { useState, useEffect } from "react";
import { X, Play, Trash2, Clock } from "lucide-react";
import { getHeldSales, deleteSale } from "../../services/SaleDefinition/saleService";
import { notify } from "../../utils/notify";

export default function HeldSalesModal({ isOpen, onClose, onResumeSale }) {
  const [heldSales, setHeldSales] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadHeldSales = async () => {
    setLoading(true);
    try {
      const data = await getHeldSales();
      setHeldSales(data);
    } catch (err) {
      notify.error("Failed to load held sales");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) loadHeldSales();
  }, [isOpen]);

  const handleDelete = async (e, id) => {
    e.stopPropagation(); // Prevent row click
    if (!window.confirm("Are you sure you want to delete this held sale?")) return;
    try {
      await deleteSale(id);
      notify.success("Held sale deleted");
      loadHeldSales();
    } catch (err) {
      notify.error("Failed to delete held sale");
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000, padding: "20px" }}>
      <div style={{ background: "#fff", borderRadius: "16px", width: "100%", maxWidth: "500px", overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "80vh", boxShadow: "0 24px 48px rgba(0,0,0,0.2)" }}>
        
        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #EAEDF2", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#F8FAFC" }}>
          <h2 style={{ margin: 0, fontSize: "18px", color: "#12203A", display: "flex", alignItems: "center", gap: "8px" }}>
            <Clock size={20} color="#0D9488" /> Held Sales (Parked)
          </h2>
          <button onClick={onClose} style={{ background: "#E2E8F0", border: "none", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={18} />
          </button>
        </div>

        {/* List */}
        <div style={{ overflowY: "auto", padding: "16px", flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#6B7A8F" }}>Loading...</div>
          ) : heldSales.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#6B7A8F" }}>
              <Clock size={40} style={{ opacity: 0.2, marginBottom: "16px" }} />
              <p>No held sales found.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {heldSales.map(sale => (
                <div 
                  key={sale.saleId} 
                  onClick={() => onResumeSale(sale)}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", border: "1px solid #EAEDF2", borderRadius: "12px", cursor: "pointer", transition: "all 0.2s", background: "#fff" }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = "#0D9488"}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = "#EAEDF2"}
                >
                  <div>
                    <div style={{ fontWeight: "bold", color: "#12203A", fontSize: "15px" }}>{sale.invoiceNumber}</div>
                    <div style={{ fontSize: "12px", color: "#6B7A8F", marginTop: "4px" }}>
                      {sale.customerName || "Walk-in"} • {new Date(sale.saleDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{ fontWeight: "700", color: "#0D9488", fontSize: "16px" }}>
                      Rs {sale.total?.toFixed(2)}
                    </div>
                    <button 
                      onClick={(e) => handleDelete(e, sale.saleId)}
                      style={{ background: "#FEE2E2", border: "none", width: 32, height: 32, borderRadius: "8px", cursor: "pointer", color: "#DC2626", display: "flex", alignItems: "center", justifyContent: "center" }}
                      title="Delete Held Sale"
                    >
                      <Trash2 size={16} />
                    </button>
                    <div style={{ background: "#0D9488", width: 32, height: 32, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                      <Play size={16} fill="currentColor" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}