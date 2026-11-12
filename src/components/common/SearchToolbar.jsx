// components/common/SearchToolbar.jsx
import { Search, Eye, EyeOff, Printer, Download, Filter, ChevronDown } from "lucide-react";
import "../../assets/styles/common/SearchToolbar.css";

function SearchToolbar({
  showSearch = false,
  onToggleSearch,
  activeFilterCount = 0,
  searchLabel = "Search",
  hideLabel = "Hide Search",
  showExtraColumns = false,
  onToggleExtraColumns,
  extraColumnsCount = 0,
  extraColumnsLabel = "Extra Columns",
  onPrint,
  onExportCSV,
  printLabel = "Print",
  csvLabel = "Export CSV",
  extraButtons = [],
  className = "",
}) {
  return (
    <div className={`table-toolbar ${className}`}>
      <div className="toolbar-left">
        {/* Search Toggle Button */}
        <button
          className={`toolbar-btn btn-filter ${showSearch ? "active" : ""}`}
          onClick={onToggleSearch}
          aria-expanded={showSearch}
        >
          <Search size={16} strokeWidth={1.75} />
          {showSearch ? hideLabel : searchLabel}
          {activeFilterCount > 0 && (
            <span className="filter-badge">{activeFilterCount}</span>
          )}
        </button>
      </div>
      
      <div className="toolbar-right">
        {/* Extra Columns Toggle */}
        {onToggleExtraColumns && (
          <button
            className={`toolbar-btn btn-filter ${showExtraColumns ? "active" : ""}`}
            onClick={onToggleExtraColumns}
            title="Toggle extra columns"
          >
            <EyeOff size={16} strokeWidth={1.75} />
            {extraColumnsLabel}
            {showExtraColumns && extraColumnsCount > 0 && (
              <span className="filter-badge">{extraColumnsCount}</span>
            )}
          </button>
        )}

        {/* Extra Buttons */}
        {extraButtons.map((btn, index) => (
          <button
            key={index}
            className={`toolbar-btn ${btn.className || ""}`}
            onClick={btn.onClick}
            title={btn.title}
            disabled={btn.disabled}
          >
            {btn.icon}
            {btn.label}
          </button>
        ))}

        {/* Print Button */}
        {onPrint && (
          <button
            className="toolbar-btn btn-print"
            onClick={onPrint}
            title="Print"
          >
            <Printer size={16} strokeWidth={1.75} />
            {printLabel}
          </button>
        )}

        {/* CSV Export Button */}
        {onExportCSV && (
          <button
            className="toolbar-btn btn-csv"
            onClick={onExportCSV}
            title="Export to CSV"
          >
            <Download size={16} strokeWidth={1.75} />
            {csvLabel}
          </button>
        )}
      </div>
    </div>
  );
}

export default SearchToolbar;