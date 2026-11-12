// components/sales/POSItemsTab.jsx
import { useState, useRef, useEffect } from "react";
import { Search, Barcode, Box } from "lucide-react";
import { notify } from "../../utils/notify";

function POSItemsTab({
  mode,
  searchTerm,
  setSearchTerm,
  setCurrentPage,
  setFilteredProducts,
  localProducts,
  currentItems,
  totalPages,
  currentPage,
  addProductToCart,
  foundSale,
  setShowProductModal,
}) {
  const searchInputRef = useRef(null);

  // Auto-focus search bar on mount (Barcode scanners type instantly)
  useEffect(() => {
    if (searchInputRef.current) searchInputRef.current.focus();
  }, [mode]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    setCurrentPage(1);
    
    if (!val.trim()) {
      setFilteredProducts(localProducts);
    } else {
      const term = val.toLowerCase();
      const filtered = localProducts.filter(
        (p) =>
          p.name?.toLowerCase().includes(term) ||
          p.code?.toLowerCase().includes(term) ||
          p.barcode?.toLowerCase().includes(term)
      );
      setFilteredProducts(filtered);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && searchTerm.trim()) {
      // Exact match for barcode scanner
      const term = searchTerm.trim().toLowerCase();
      const exactMatch = localProducts.find(
        (p) => p.code?.toLowerCase() === term || p.barcode?.toLowerCase() === term
      );

      if (exactMatch) {
        addProductToCart(exactMatch);
        setSearchTerm("");
        setFilteredProducts(localProducts);
        // Keep focus in the box for the next scan
        setTimeout(() => searchInputRef.current?.focus(), 50);
      } else if (currentItems.length === 1) {
        // If exactly one result matches the text, add it
        addProductToCart(currentItems[0]);
        setSearchTerm("");
        setFilteredProducts(localProducts);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      } else {
        notify.warning("No exact barcode match found.");
      }
    }
  };

  return (
    <div className="pos-items-tab" style={{ display: "flex", flexDirection: "column", height: "100%", gap: "16px" }}>
      
      {/* Search / Barcode Input */}
      <div style={{ position: "relative" }}>
        <div style={{ position: "absolute", left: 14, top: 14, color: "var(--color-text-secondary)" }}>
          <Barcode size={20} />
        </div>
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Scan barcode or type product name..."
          value={searchTerm}
          onChange={handleSearchChange}
          onKeyDown={handleKeyDown}
          style={{
            width: "100%", padding: "14px 14px 14px 44px", fontSize: "16px",
            borderRadius: "var(--radius-md)", border: "2px solid var(--color-primary)",
            boxShadow: "0 4px 12px rgba(13, 148, 136, 0.15)", outline: "none",
            background: "#fff"
          }}
        />
        {!searchTerm && (
          <span style={{ position: "absolute", right: 14, top: 16, fontSize: "12px", color: "var(--color-text-secondary)" }}>
            Press Enter to add
          </span>
        )}
      </div>

      {/* Quick Add Grid */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "12px" }}>
          {currentItems.map((product) => {
            const stock = product.currentStock || 0;
            const outOfStock = stock <= 0 && mode === "sale";
            return (
              <div
                key={product.productId}
                onClick={() => {
                  if (!outOfStock) {
                    addProductToCart(product);
                    searchInputRef.current?.focus();
                  }
                }}
                style={{
                  background: outOfStock ? "#F9FAFB" : "#fff",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)", padding: "12px",
                  cursor: outOfStock ? "not-allowed" : "pointer",
                  transition: "var(--transition)",
                  opacity: outOfStock ? 0.6 : 1,
                  display: "flex", flexDirection: "column", justifyContent: "space-between"
                }}
                onMouseEnter={(e) => !outOfStock && (e.currentTarget.style.borderColor = "var(--color-primary)")}
                onMouseLeave={(e) => !outOfStock && (e.currentTarget.style.borderColor = "var(--color-border)")}
              >
                <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "4px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {product.name}
                </div>
                <div style={{ fontSize: "11px", color: "var(--color-text-secondary)", marginBottom: "8px" }}>
                  {product.code}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-primary)" }}>
                    Rs {product.retailPrice}
                  </span>
                  <span style={{ fontSize: "11px", fontWeight: 600, color: outOfStock ? "var(--color-danger)" : stock < 10 ? "var(--color-warning)" : "var(--color-success)" }}>
                    {stock} left
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: "8px", paddingTop: "12px", borderTop: "1px solid var(--color-border-light)" }}>
          <button className="btn btn-outline btn-sm" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>Prev</button>
          <span style={{ fontSize: "13px", display: "flex", alignItems: "center", fontWeight: 600 }}>Page {currentPage} of {totalPages}</span>
          <button className="btn btn-outline btn-sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}

export default POSItemsTab;