// components/grn/GRNProductPicker.jsx
import { Search, BookOpen } from "lucide-react";

function GRNProductPicker({
  searchTerm,
  onSearchChange,
  filteredProducts,
  onProductClick,
  onBrowseClick,
}) {
  return (
    <div className="grn-picker-section">
      <p className="mode-description">
        Search and add products manually to this GRN.
      </p>

      <div className="product-search-row">
        <div className="search-input-wrapper">
          <Search size={16} strokeWidth={2} />
          <input
            type="text"
            className="input"
            placeholder="Start typing or scanning item code..."
            value={searchTerm}
            onChange={onSearchChange}
          />
        </div>
        <button type="button" className="btn btn-primary" onClick={onBrowseClick}>
          <BookOpen size={14} strokeWidth={2} />
          Browse
        </button>
      </div>

      {searchTerm && filteredProducts.length > 0 && (
        <div className="quick-results">
          {filteredProducts.slice(0, 5).map((product) => (
            <div
              key={product.productId}
              className="quick-result-item"
              onClick={() => onProductClick(product, true)}
            >
              <span className="result-code">{product.code}</span>
              <span className="result-name">{product.name}</span>
              <span className="result-price">
                PKR {product.costPrice || 0}
              </span>
              <button className="btn-add-small" type="button">
                +
              </button>
            </div>
          ))}
          {filteredProducts.length > 5 && (
            <div className="quick-result-more">
              + {filteredProducts.length - 5} more results — click "Browse" to see all
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default GRNProductPicker;