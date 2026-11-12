// components/grn/GRNEntryModeTabs.jsx
import { Package, List } from "lucide-react";

function GRNEntryModeTabs({ entryMode, onChange }) {
  return (
    <div className="grn-entry-section">
      <h3>
        <Package size={16} strokeWidth={2} />
        Add Items
      </h3>

      <div className="entry-mode-tabs">
        <button
          type="button"
          className={`entry-mode-btn ${entryMode === "product" ? "active" : ""}`}
          onClick={() => onChange("product")}
        >
          <List size={14} strokeWidth={2} />
          Product List
        </button>
        <button
          type="button"
          className={`entry-mode-btn ${entryMode === "purchase" ? "active" : ""}`}
          onClick={() => onChange("purchase")}
        >
          <Package size={14} strokeWidth={2} />
          Purchase Order
        </button>
      </div>
    </div>
  );
}

export default GRNEntryModeTabs;