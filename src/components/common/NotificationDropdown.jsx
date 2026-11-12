// components/common/NotificationDropdown.jsx
import { useState, useEffect, useRef } from "react";
import {
  Bell, RefreshCw, CheckCircle, Package, AlertTriangle, 
  AlertCircle, Box, ChevronRight, Clock, Wallet, TrendingUp, X
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getSales } from "../../services/SaleDefinition/saleService";
import { api } from "../../services/apiClient";
import "../../assets/styles/common/NotificationDropdown.css";

function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const [alerts, setAlerts] = useState({
    lowStock: [],
    heldSales: [],
    udhaar: [],
    todaySales: 0
  });

  const API_URL = "https://localhost:7219/api";

  useEffect(() => {
    checkAllAlerts();
    const interval = setInterval(checkAllAlerts, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const checkAllAlerts = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [stockRes, salesRes, khataRes] = await Promise.all([
        fetch(`${API_URL}/Products/low-stock`),
        getSales(),
        api.get("/api/Customers/balances").catch(() => [])
      ]);

      // 1. Process Low Stock
      const stockData = stockRes.ok ? await stockRes.json() : [];
      
      // 2. Process Held Sales
      const allSales = salesRes || [];
      const heldSales = allSales.filter(s => s.status?.toLowerCase() === "draft");

      // 3. Process Udhaar (Customers who owe money)
      const khataData = khataRes || [];
      const pendingUdhaar = khataData.filter(c => Number(c.currentBalance) > 0);

      // 4. Process Today's Sales
      const todayStr = new Date().toDateString();
      const todaysTotal = allSales
        .filter(s => new Date(s.saleDate).toDateString() === todayStr && s.status?.toLowerCase() === "completed")
        .reduce((sum, s) => sum + Number(s.total), 0);

      setAlerts({
        lowStock: stockData,
        heldSales: heldSales,
        udhaar: pendingUdhaar,
        todaySales: todaysTotal
      });
    } catch (error) {
      console.error("Error checking alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalAlerts = alerts.lowStock.length + alerts.heldSales.length + alerts.udhaar.length;

  return (
    <div className="notification-dropdown" ref={dropdownRef}>
      
      {/* Bell Button */}
      <button
        className={`notification-btn ${totalAlerts > 0 ? "has-notification" : ""}`}
        onClick={() => { setIsOpen(!isOpen); if (!isOpen) checkAllAlerts(); }}
      >
        <Bell size={18} strokeWidth={1.75} />
        {totalAlerts > 0 && <span className="notification-badge">{totalAlerts}</span>}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="notification-dropdown-menu" style={{ width: "360px" }}>
          
          <div className="notification-header">
            <span className="notification-title"><AlertCircle size={16} /> Alerts Center</span>
            <button className="notification-refresh" onClick={checkAllAlerts} disabled={loading}>
              <RefreshCw size={16} className={loading ? "spinning" : ""} />
            </button>
          </div>

          <div className="notification-body" style={{ maxHeight: "400px", overflowY: "auto" }}>
            
            {loading ? (
              <div className="notification-loading"><RefreshCw size={20} className="spinning" /> Checking alerts...</div>
            ) : (
              <>
                {/* ✅ NEW: Today's Sales Summary */}
               <div className="sales-summary-banner">
  <span className="sales-summary-label"><TrendingUp size={16} /> Today's Sales</span>
  <span className="sales-summary-value">Rs {alerts.todaySales.toFixed(2)}</span>
</div>
               

                {/* ✅ NEW: Held Sales */}
                {alerts.heldSales.length > 0 && (
             <div className="alert-section">
  <div className="alert-section-header">
    <span className="alert-section-title warning"><Clock size={16} /> Held Sales</span>
    <span className="alert-section-count">{alerts.heldSales.length}</span>
  </div>
  <button onClick={() => { navigate("/pos"); setIsOpen(false); }} className="alert-action-btn">
    Resume Held Sales <ChevronRight size={14} />
  </button>
</div>
                )}

                {/* ✅ NEW: Udhaar Pending */}
                {alerts.udhaar.length > 0 && (
              <div className="alert-section">
  <div className="alert-section-header">
    <span className="alert-section-title danger"><Wallet size={16} /> Udhaar Pending</span>
    <span className="alert-section-count">{alerts.udhaar.length}</span>
  </div>
  <button onClick={() => { navigate("/khata"); setIsOpen(false); }} className="alert-action-btn">
    Open Khata Ledger <ChevronRight size={14} />
  </button>
</div>
                )}

                {/* Low Stock (Existing Logic) */}
                {alerts.lowStock.length > 0 && (
                  <div style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-warning)", display: "flex", alignItems: "center", gap: "6px" }}>
                        <AlertTriangle size={16} /> Low Stock Alerts
                      </span>
                      <span style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>{alerts.lowStock.length} products</span>
                    </div>
                    <ul className="notification-list">
                      {alerts.lowStock.slice(0, 3).map((item) => (
                        <li key={item.productId} style={{ padding: "8px 0", borderBottom: "1px dashed #EAEDF2" }}>
                          <div style={{ fontSize: "13px", fontWeight: 600 }}>{item.name}</div>
                          <div style={{ fontSize: "12px", color: "var(--color-danger)" }}>
                            Only {item.currentStock} left
                          </div>
                        </li>
                      ))}
                    </ul>
                    {alerts.lowStock.length > 3 && <div style={{ fontSize: "12px", textAlign: "center", marginTop: "8px" }}>+{alerts.lowStock.length - 3} more</div>}
                    <button onClick={() => { navigate("/products"); setIsOpen(false); }} className="btn btn-outline btn-sm" style={{ width: "100%", marginTop: "12px" }}>
                      Manage Products <ChevronRight size={14} />
                    </button>
                  </div>
                )}

                {/* Empty State */}
                {totalAlerts === 0 && (
                  <div className="notification-empty" style={{ padding: "40px 20px" }}>
                    <CheckCircle size={32} strokeWidth={1.5} className="empty-icon" style={{ color: "var(--color-success)", marginBottom: "12px" }} />
                    <p style={{ fontWeight: 600 }}>All clear!</p>
                    <p style={{ fontSize: "12px" }}>No pending alerts right now.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationDropdown;