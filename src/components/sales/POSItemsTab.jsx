// components/sales/POSItemsTab.jsx
import { useRef, useEffect, useState } from "react";
import { Barcode, Filter, Package, X } from "lucide-react";
import { notify } from "../../utils/notify";
import { useTranslation } from "react-i18next";
import { useSettings } from "../../contexts/SettingsContext";
import EmptyState from "../common/EmptyState";

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
  selectedCategory,
  setSelectedCategory,
  showOutOfStock,
  setShowOutOfStock,
  categories,
  setShowProductModal,
}) {
  const { t } = useTranslation();
  const searchInputRef = useRef(null);
  const { formatCurrency } = useSettings();
  const [showCategoryFilters, setShowCategoryFilters] = useState(false);

  // Auto-focus search bar (barcode scanners type instantly).
  useEffect(() => {
    if (searchInputRef.current) searchInputRef.current.focus();
  }, [mode]);

  useEffect(() => {
    let filtered = localProducts;

    if (selectedCategory !== null) {
      filtered = filtered.filter(
        (product) => product.categoryId === selectedCategory
      );
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.name?.toLowerCase().includes(term) ||
          product.code?.toLowerCase().includes(term) ||
          product.barcode?.toLowerCase().includes(term)
      );
    }

    if (!showOutOfStock) {
      filtered = filtered.filter((product) => Number(product.currentStock) > 0);
    }

    setFilteredProducts(filtered);
    setCurrentPage(1);
  }, [
    localProducts,
    searchTerm,
    selectedCategory,
    showOutOfStock,
    setCurrentPage,
    setFilteredProducts,
  ]);

  const handleSearchChange = (val) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && searchTerm.trim()) {
      // Exact match for barcode scanner.
      const term = searchTerm.trim().toLowerCase();
      const exactMatch = localProducts.find(
        (p) => p.code?.toLowerCase() === term || p.barcode?.toLowerCase() === term
      );

      if (exactMatch) {
        addProductToCart(exactMatch);
        setSearchTerm("");
        setFilteredProducts(localProducts);
        // Keep focus in the box for the next scan.
        setTimeout(() => searchInputRef.current?.focus(), 50);
      } else if (currentItems.length === 1) {
        // If exactly one result matches the text, add it.
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
    <div className="pos-items-tab">
      <div className="search-row">
        <div className="search-input-wrapper">
          <div className="pos-item-search">
            <Barcode className="pos-item-search-icon" size={17} strokeWidth={2} />
            <input
              ref={searchInputRef}
              type="text"
              className="pos-item-search-input"
              placeholder={t("pos.scanBarcode")}
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            {searchTerm && (
              <button
                type="button"
                className="pos-item-search-clear"
                onClick={() => {
                  handleSearchChange("");
                  searchInputRef.current?.focus();
                }}
                aria-label="Clear product search"
              >
                <X size={15} />
              </button>
            )}
            {!searchTerm && <span className="pos-item-search-hint">Enter to add</span>}
          </div>
        </div>
        <button
          type="button"
          className={`pos-items-filter-button${selectedCategory !== null || showOutOfStock ? " active" : ""}`}
          onClick={() => setShowCategoryFilters((visible) => !visible)}
          aria-label="Toggle category filters"
          aria-expanded={showCategoryFilters}
        >
          <Filter size={18} />
        </button>
        <button
          type="button"
          className="btn-browse-all"
          onClick={() => setShowProductModal(true)}
        >
          <Package size={18} />
          <span>Browse All</span>
        </button>
      </div>

      {showCategoryFilters && (
        <div className="category-chips">
          <button
            type="button"
            className={`chip${selectedCategory === null ? " active" : ""}`}
            onClick={() => setSelectedCategory(null)}
            aria-pressed={selectedCategory === null}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              type="button"
              className={`chip${selectedCategory === category.categoryId ? " active" : ""}`}
              key={category.categoryId}
              onClick={() => setSelectedCategory(category.categoryId)}
              aria-pressed={selectedCategory === category.categoryId}
            >
              {category.name}
            </button>
          ))}
          <button
            type="button"
            className={`chip out-of-stock-toggle${showOutOfStock ? " active" : ""}`}
            onClick={() => setShowOutOfStock((current) => !current)}
            aria-pressed={showOutOfStock}
          >
            {showOutOfStock ? "Hide Out of Stock" : "Show Out of Stock"}
          </button>
        </div>
      )}

      <div className="pos-item-results">
        <div className="product-grid">
          {currentItems.length ? (
            currentItems.map((product) => {
              const stock = Number(product.currentStock) || 0;
              const outOfStock = stock <= 0;

              return (
                <button
                  type="button"
                  key={product.productId}
                  className={`product-card${outOfStock ? " out-of-stock" : ""}`}
                  disabled={outOfStock}
                  onClick={() => {
                    addProductToCart(product);
                    searchInputRef.current?.focus();
                  }}
                >
                  <span className="product-name">{product.name}</span>
                  <span className="product-code">{product.code}</span>
                  <span className="product-card-footer">
                    <span className="product-price">
                      {formatCurrency(product.retailPrice)}
                    </span>
                    <span className={`product-stock${outOfStock ? " zero" : ""}`}>
                      {stock} left
                    </span>
                  </span>
                </button>
              );
            })
          ) : (
            <EmptyState
              title="No products match your filter."
              compact
              action={<button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setShowProductModal(true)}
              >
                Browse All Products
              </button>}
            />
          )}
        </div>
      </div>

      {totalPages > 1 && (
        <div className="pos-item-pagination">
          <button
            className="btn btn-outline btn-sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            {t("pos.previous")}
          </button>
          <span>{t("pos.pageOf", { current: currentPage, total: totalPages })}</span>
          <button
            className="btn btn-outline btn-sm"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            {t("pos.next")}
          </button>
        </div>
      )}
    </div>
  );
}

export default POSItemsTab;
