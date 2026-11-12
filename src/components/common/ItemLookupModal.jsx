// components/common/ItemLookupModal.jsx
import { useState, useEffect, useMemo } from "react";
import "../../assets/styles/common/ItemLookupModal.css";
import { notify } from "../../utils/notify";

function ItemLookupModal({
  isOpen = false,
  onClose,
  onSelectItem,
  items = [],
  selectedItems = [],
  title = "Select Items",
  searchPlaceholder = "Search items...",
  columns = [],
  loading = false,
  emptyMessage = "No items found",
  multiSelect = false,
  onRefresh = null,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);

  // Update selected IDs when selectedItems changes
  useEffect(() => {
    if (selectedItems.length > 0) {
      const ids = selectedItems.map((item) => item.productId || item.id);
      setSelectedIds(ids);
    } else {
      setSelectedIds([]);
    }
  }, [selectedItems]);

  // Client-side search
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;

    const term = searchTerm.toLowerCase().trim();
    return items.filter((item) => {
      const searchableFields = [
        item.code,
        item.name,
        item.barcode,
        item.sku,
        item.description,
      ].filter(Boolean);

      return searchableFields.some((field) =>
        String(field).toLowerCase().includes(term)
      );
    });
  }, [items, searchTerm]);

  const handleItemClick = (item) => {
    const itemId = item.productId || item.id;

    if (multiSelect) {
      if (selectedIds.includes(itemId)) {
        setSelectedIds(selectedIds.filter((id) => id !== itemId));
        onSelectItem(item, false);
      } else {
        setSelectedIds([...selectedIds, itemId]);
        onSelectItem(item, true);
      }
    } else {
      onSelectItem(item, true);
      onClose();
    }
  };

  const isItemSelected = (item) => {
    const itemId = item.productId || item.id;
    return selectedIds.includes(itemId);
  };

  // Default columns if none provided
  const defaultColumns = [
    { key: "code", label: "Code" },
    { key: "name", label: "Name" },
    {
      key: "price",
      label: "Price",
      className: "numeric",
      render: (item) => `PKR ${item.price || item.retailPrice || 0}`,
    },
  ];

  const displayColumns = columns.length > 0 ? columns : defaultColumns;

  // Reset search when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("");
    }
  }, [isOpen]);

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
            {onRefresh && (
              <button
                className="btn-refresh"
                onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    await onRefresh();
                  } catch (error) {
                    console.error("Refresh failed:", error);
                  }
                }}
                title="Refresh product list"
              >
                🔄
              </button>
            )}
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

        {/* Loading State */}
        {loading && (
          <div className="item-lookup-modal-loading">
            <div className="spinner"></div>
            <p>Loading items...</p>
          </div>
        )}

        {/* Items Table */}
        {!loading && (
          <div className="item-lookup-modal-body">
            {filteredItems.length === 0 ? (
              <div className="item-lookup-modal-empty">
                <div className="empty-icon">📭</div>
                <p>
                  {searchTerm
                    ? `No results found for "${searchTerm}"`
                    : emptyMessage}
                </p>
              </div>
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
                      const selected = isItemSelected(item);
                      return (
                        <tr
                          key={item.productId || item.id}
                          className={selected ? "selected-row" : ""}
                          onClick={() => handleItemClick(item)}
                          style={{ cursor: "pointer" }}
                        >
                          {displayColumns.map((col) => (
                            <td key={col.key} className={col.className || ""}>
                              {col.render
                                ? col.render(item)
                                : item[col.key] || "-"}
                            </td>
                          ))}
                          <td>
                            <button
                              className={`btn btn-sm ${
                                selected ? "btn-success" : "btn-primary"
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleItemClick(item);
                              }}
                            >
                              {selected
                                ? multiSelect
                                  ? "✓ Selected"
                                  : "✓ Added"
                                : multiSelect
                                ? "Select"
                                : "Add"}
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
          <div className="selected-count">
            {multiSelect && selectedIds.length > 0 && (
              <span>{selectedIds.length} items selected</span>
            )}
          </div>
          <div className="item-lookup-modal-actions">
            <button className="btn btn-outline" onClick={onClose}>
              Close
            </button>
            {multiSelect && (
              <button
                className="btn btn-primary"
                onClick={() => {
                  if (selectedIds.length === 0) {
                    notify.warning("Please select at least one item");
                    return;
                  }
                  onClose();
                }}
              >
                Confirm Selection ({selectedIds.length})
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ItemLookupModal;