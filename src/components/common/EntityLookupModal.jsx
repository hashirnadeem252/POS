// components/common/EntityLookupModal.jsx
import { useState, useEffect, useMemo } from "react";
import "../../assets/styles/common/ItemLookupModal.css";
import EmptyState from "./EmptyState";

/**
 * EntityLookupModal — single-select picker for entities
 * (Customer, Sales Person, Supplier, etc.).
 *
 * Behavior:
 *   - User clicks a row → immediately calls onSelect(item) and closes.
 *   - No multi-select, no persistent state in the modal.
 *   - Selecting a different entity replaces the current selection.
 */
function EntityLookupModal({
  isOpen = false,
  onClose,
  onSelect,
  items = [],
  selectedItem = null,
  title = "Select",
  searchPlaceholder = "Search...",
  columns = [],
  loading = false,
  emptyMessage = "No items found",
  idField,          // e.g. "customerId" | "salesPersonId" | "supplierId"
}) {
  const [searchTerm, setSearchTerm] = useState("");

  // Reset search on open
  useEffect(() => {
    if (isOpen) setSearchTerm("");
  }, [isOpen]);

  // Selected ID resolver
  const selectedId = useMemo(() => {
    if (!selectedItem) return null;
    if (idField && selectedItem[idField] != null) return selectedItem[idField];
    // Fallbacks for common entity types
    return (
      selectedItem.customerId ??
      selectedItem.salesPersonId ??
      selectedItem.supplierId ??
      selectedItem.id ??
      null
    );
  }, [selectedItem, idField]);

  // Get ID from any item in the list
  const getItemId = (item) => {
    if (idField && item?.[idField] != null) return item[idField];
    return (
      item?.customerId ??
      item?.salesPersonId ??
      item?.supplierId ??
      item?.id ??
      null
    );
  };

  // Client-side search
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    const term = searchTerm.toLowerCase().trim();

    return items.filter((item) => {
      const searchableFields = [
        item.code,
        item.name,
        item.phone,
        item.email,
        item.contactPerson,
        item.city,
      ].filter(Boolean);

      return searchableFields.some((field) =>
        String(field).toLowerCase().includes(term)
      );
    });
  }, [items, searchTerm]);

  const handleRowClick = (item) => {
    const id = getItemId(item);
    if (id == null) return;
    onSelect(item);
    onClose();
  };

  const defaultColumns = [
    { key: "code", label: "Code" },
    { key: "name", label: "Name" },
    { key: "phone", label: "Phone" },
  ];

  const displayColumns = columns.length > 0 ? columns : defaultColumns;

  if (!isOpen) return null;

  return (
    <div className="item-lookup-modal-overlay" onClick={onClose}>
      <div
        className="item-lookup-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="item-lookup-modal-header">
          <h3>{title}</h3>
          <div className="header-actions">
            <button className="item-lookup-modal-close" onClick={onClose}>
              ×
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="item-lookup-modal-search">
          <input
            type="text"
            className="input"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
          <span className="item-lookup-modal-count">
            {filteredItems.length} items found
          </span>
        </div>

        {/* Loading */}
        {loading && (
          <div className="item-lookup-modal-loading">
            <div className="spinner"></div>
            <p>Loading items...</p>
          </div>
        )}

        {/* Table */}
        {!loading && (
          <div className="item-lookup-modal-body">
            {filteredItems.length === 0 ? (
              <EmptyState
                title={searchTerm ? `No results found for "${searchTerm}"` : emptyMessage}
                compact
              />
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      {displayColumns.map((col) => (
                        <th key={col.key} className={col.className || ""}>
                          {col.label}
                        </th>
                      ))}
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item) => {
                      const id = getItemId(item);
                      const isSelected = id != null && id === selectedId;

                      return (
                        <tr
                          key={id ?? `tmp-${Math.random()}`}
                          className={isSelected ? "selected-row" : ""}
                          onClick={() => handleRowClick(item)}
                          style={{ cursor: "pointer" }}
                        >
                          {displayColumns.map((col) => (
                            <td key={col.key} className={col.className || ""}>
                              {col.render
                                ? col.render(item)
                                : item[col.key] ?? "-"}
                            </td>
                          ))}
                          <td>
                            <button
                              className={`btn btn-sm ${
                                isSelected ? "btn-success" : "btn-primary"
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRowClick(item);
                              }}
                            >
                              {isSelected ? "✓ Selected" : "Select"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="item-lookup-modal-footer">
          <div className="selected-count"></div>
          <div className="item-lookup-modal-actions">
            <button className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EntityLookupModal;