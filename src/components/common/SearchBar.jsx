// components/common/SearchBar.jsx
import { Search, RotateCcw, Loader2 } from "lucide-react";
import FormInput from "./FormInput";
import FormSelect from "./FormSelect";
import FormDatePicker from "./FormDatePicker";
import "../../assets/styles/common/SearchBar.css";

/**
 * SearchBar Component
 * A collapsible search panel with dynamic filter fields.
 *
 * Field types supported: "text" | "number" | "select" | "date"
 *
 * @param {Array}    fields         - Array of field configs
 * @param {Object}   filters        - Current filter values
 * @param {Function} onFilterChange - Callback when a filter value changes
 * @param {Function} onSearch       - Callback when search is submitted
 * @param {Function} onReset        - Callback when reset is clicked
 * @param {boolean}  isOpen         - Whether the search panel is visible
 * @param {string}   className      - Additional CSS class
 * @param {string}   searchLabel    - Label for search button
 * @param {string}   resetLabel     - Label for reset button
 * @param {boolean}  loading        - Loading state
 * @param {ReactNode} children      - Additional custom filter content
 */
function SearchBar({
  fields = [],
  filters = {},
  onFilterChange,
  onSearch,
  onReset,
  isOpen = false,
  className = "",
  searchLabel = "Search",
  resetLabel = "Reset",
  loading = false,
  children,
}) {
  // =========================
  // Handlers
  // =========================
  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearch && !loading) {
      onSearch();
    }
  };

  const handleReset = () => {
    if (onReset && !loading) {
      onReset();
    }
  };

  // Don't render if there's nothing to show
  if (fields.length === 0 && !children) {
    return null;
  }

  // =========================
  // Group fields into rows of 2
  // =========================
  const getRows = () => {
    const rows = [];
    for (let i = 0; i < fields.length; i += 2) {
      rows.push(fields.slice(i, i + 2));
    }
    return rows;
  };

  const rows = getRows();

  // =========================
  // Emit change in the same shape as native events
  // =========================
  const emitChange = (name, value) => {
    if (onFilterChange) {
      onFilterChange({ target: { name, value } });
    }
  };

  // =========================
  // Render a single filter field
  // =========================
  const renderField = (field) => {
    const value = filters[field.name] ?? "";

    switch (field.type) {
      case "select":
        return (
          <FormSelect
            name={field.name}
            value={value}
            onChange={(e) => emitChange(e.target.name, e.target.value)}
            options={field.options || []}
            placeholder={field.placeholder || `All ${field.label}`}
            searchPlaceholder={`Search ${field.label?.toLowerCase()}...`}
            disabled={loading}
            searchable={field.searchable !== false}
          />
        );

      case "date":
        return (
          <FormDatePicker
            name={field.name}
            value={value}
            onChange={(e) => emitChange(e.target.name, e.target.value)}
            placeholder={field.placeholder || "Select date"}
            disabled={loading}
          />
        );

      case "number":
        return (
          <FormInput
            name={field.name}
            type="number"
            value={value}
            onChange={(e) => emitChange(e.target.name, e.target.value)}
            placeholder={field.placeholder || `Search by ${field.label}...`}
            disabled={loading}
          />
        );

      default:
        return (
          <FormInput
            name={field.name}
            type="text"
            value={value}
            onChange={(e) => emitChange(e.target.name, e.target.value)}
            placeholder={field.placeholder || `Search by ${field.label}...`}
            disabled={loading}
          />
        );
    }
  };

  // =========================
  // Render
  // =========================
  return (
    <div className={`search-dropdown ${isOpen ? "open" : ""} ${className}`}>
      <form onSubmit={handleSubmit}>
        <div className="search-filters">
          {/* Dynamic filter fields */}
          {fields.length > 0 && (
            <div className="filter-grid">
              {rows.map((rowFields, rowIndex) => (
                <div key={`row-${rowIndex}`} className="filter-row">
                  {rowFields.map((field) => (
                    <div key={field.name} className="filter-group">
                      {field.label && (
                        <label
                          htmlFor={field.name}
                          className="filter-label"
                        >
                          {field.label}
                        </label>
                      )}

                      {renderField(field)}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Custom filter content */}
          {children && <div className="filter-children">{children}</div>}

          {/* Action buttons */}
          <div className="filter-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="spinning" />
                  Searching...
                </>
              ) : (
                <>
                  <Search size={16} strokeWidth={2} />
                  {searchLabel}
                </>
              )}
            </button>

            <button
              type="button"
              className="btn btn-outline"
              onClick={handleReset}
              disabled={loading}
            >
              <RotateCcw size={16} strokeWidth={2} />
              {resetLabel}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default SearchBar;