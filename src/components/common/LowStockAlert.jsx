// components/common/LowStockAlert.jsx
import { useState, useEffect } from "react";
import "../../assets/styles/common/LowStockAlert.css";

function LowStockAlert({ onRefresh }) {
  const [lowStockItems, setLowStockItems] = useState([]);
  const [showAlert, setShowAlert] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  const API_URL = "https://localhost:7219/api/Products";

  useEffect(() => {
    checkLowStock();
    // Auto-refresh every 60 seconds
    const interval = setInterval(checkLowStock, 60000);
    return () => clearInterval(interval);
  }, []);

  const checkLowStock = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/low-stock`);
      if (response.ok) {
        const data = await response.json();
        setLowStockItems(data);
        setLowStockCount(data.length);
        setShowAlert(data.length > 0);
      }
    } catch (error) {
      console.error("Error checking low stock:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!showAlert || loading) return null;

  const handleRefresh = async () => {
    await checkLowStock();
    if (onRefresh) onRefresh();
  };

  const outOfStock = lowStockItems.filter(item => item.currentStock <= 0);
  const lowStock = lowStockItems.filter(item => item.currentStock > 0 && item.currentStock <= item.minimumStock);

  return (
    <div className={`low-stock-alert ${isExpanded ? "expanded" : ""}`}>
      <div className="alert-header" onClick={() => setIsExpanded(!isExpanded)}>
        <span className="alert-icon">⚠️</span>
        <span className="alert-title">Low Stock Alert</span>
        <span className="alert-count">{lowStockCount} items</span>
        <button 
          className="alert-toggle" 
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
        >
          {isExpanded ? "▲" : "▼"}
        </button>
        <button className="alert-close" onClick={() => setShowAlert(false)}>×</button>
      </div>

      {isExpanded && (
        <div className="alert-body">
          <div className="alert-summary">
            {outOfStock.length > 0 && (
              <div className="summary-item danger">
                <span className="summary-icon">🔴</span>
                <span>Out of Stock: {outOfStock.length}</span>
              </div>
            )}
            {lowStock.length > 0 && (
              <div className="summary-item warning">
                <span className="summary-icon">🟡</span>
                <span>Low Stock: {lowStock.length}</span>
              </div>
            )}
          </div>

          <ul>
            {lowStockItems.slice(0, 20).map(item => {
              const isOutOfStock = item.currentStock <= 0;
              return (
                <li key={item.productId} className={isOutOfStock ? "out-of-stock" : "low-stock"}>
                  <span className="product-name">{item.name}</span>
                  <span className="product-code">{item.code}</span>
                  <div className="stock-info">
                    <span className="stock-value">{item.currentStock}</span>
                    <span className="stock-min">/ {item.minimumStock}</span>
                  </div>
                  <span className={`stock-status ${item.statusColor}`}>
                    {item.stockStatus}
                  </span>
                </li>
              );
            })}
          </ul>

          {lowStockItems.length > 20 && (
            <p className="more-items">+ {lowStockItems.length - 20} more items</p>
          )}

          <div className="alert-actions">
            <button className="btn btn-primary btn-sm" onClick={handleRefresh}>
              🔄 Refresh
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => window.location.href = "/products"}>
              📦 View Products
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default LowStockAlert;