import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ChevronDown, Package, X } from "lucide-react";
import { Link } from "react-router-dom";
import "../../assets/styles/common/LowStockAlert.css";

function LowStockAlert({ products = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const alertRef = useRef(null);
  const lowStockItems = useMemo(
    () =>
      products.filter((product) => {
        const stock = Number(product.currentStock);
        const minimumStock = Number(product.minimumStock);
        return (
          Number.isFinite(stock) &&
          Number.isFinite(minimumStock) &&
          stock <= minimumStock
        );
      }),
    [products]
  );

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!alertRef.current?.contains(event.target)) setIsOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  if (lowStockItems.length === 0) return null;

  const outOfStockCount = lowStockItems.filter(
    (product) => Number(product.currentStock) <= 0
  ).length;

  return (
    <div className="low-stock-alert" ref={alertRef}>
      <button
        type="button"
        className={`low-stock-alert-trigger ${outOfStockCount ? "has-out-of-stock" : ""}`}
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={`${lowStockItems.length} low-stock products${outOfStockCount ? `, ${outOfStockCount} out of stock` : ""}`}
      >
        <span className="low-stock-alert-icon">
          <AlertTriangle size={15} />
        </span>
        <span className="low-stock-alert-count">{lowStockItems.length}</span>
        <ChevronDown
          size={13}
          className={`low-stock-alert-chevron ${isOpen ? "is-open" : ""}`}
        />
      </button>

      {isOpen && (
        <section
          className="low-stock-alert-popover"
          role="dialog"
          aria-label="Low stock products"
        >
          <header className="low-stock-alert-header">
            <div>
              <strong>Stock attention</strong>
              <span>
                {outOfStockCount > 0
                  ? `${outOfStockCount} out of stock · ${lowStockItems.length - outOfStockCount} low`
                  : `${lowStockItems.length} products below minimum`}
              </span>
            </div>
            <button
              type="button"
              className="low-stock-alert-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close low stock list"
            >
              <X size={16} />
            </button>
          </header>

          <ul className="low-stock-alert-list">
            {lowStockItems.slice(0, 6).map((product) => {
              const stock = Number(product.currentStock) || 0;
              const outOfStock = stock <= 0;
              return (
                <li key={product.productId}>
                  <span className="low-stock-product-icon">
                    <Package size={15} />
                  </span>
                  <span className="low-stock-product-copy">
                    <strong>{product.name}</strong>
                    <span>{product.code || "No product code"}</span>
                  </span>
                  <span
                    className={`low-stock-product-quantity ${outOfStock ? "is-out" : ""}`}
                  >
                    {outOfStock ? "Out" : stock}
                    <small> / {Number(product.minimumStock) || 0}</small>
                  </span>
                </li>
              );
            })}
          </ul>

          {lowStockItems.length > 6 && (
            <p className="low-stock-alert-more">
              +{lowStockItems.length - 6} more products
            </p>
          )}

          <Link
            to="/products"
            className="low-stock-alert-manage"
            onClick={() => setIsOpen(false)}
          >
            Review inventory
          </Link>
        </section>
      )}
    </div>
  );
}

export default LowStockAlert;
