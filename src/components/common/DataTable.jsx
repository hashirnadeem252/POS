// components/common/DataTable.jsx
import { useEffect, useState, useMemo } from "react";
import Pagination from "./Pagination";
import EmptyState from "./EmptyState";
import "../../assets/styles/common/Table.css";

function DataTable({
  data = [],
  columns = [],
  actions = [],
  onRowDoubleClick = null,
  emptyMessage = "No records found",
  defaultPageSize = 10,
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const visibleColumns = columns.filter(col => col.visible !== false);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return data.slice(start, end);
  }, [data, currentPage, pageSize]);

  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  function handlePageChange(page) {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }

  function handlePageSizeChange(size) {
    setPageSize(size);
    setCurrentPage(1);
  }

  if (data.length === 0) {
    return (
      <EmptyState title={emptyMessage} compact />
    );
  }

  return (
    <>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              {visibleColumns.map((col) => (
                <th key={col.key} className={col.className || ""}>
                  {col.label}
                </th>
              ))}
              {actions.length > 0 && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, index) => (
              <tr
                key={row.id || index}
                onDoubleClick={() => onRowDoubleClick && onRowDoubleClick(row)}
                style={{ cursor: onRowDoubleClick ? "pointer" : "default" }}
              >
                {visibleColumns.map((col) => (
                  <td key={col.key} className={col.className || ""}>
                    {/* ✅ FIX: Pass both row AND index to render function */}
                    {col.render ? col.render(row, index) : row[col.key] ?? "-"}
                  </td>
                ))}
                {actions.length > 0 && (
                  <td>
                    <div className="action-buttons">
                      {actions.map((action, idx) => {
                        const disabled =
                          typeof action.isDisabled === "function"
                            ? action.isDisabled(row)
                            : Boolean(action.disabled);
                        const title =
                          action.getTitle?.(row) || action.title || "";
                        return (
                          <button
                            key={idx}
                            type="button"
                            className={`btn btn-sm ${action.className || "btn-outline"}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              action.onClick(row);
                            }}
                            title={title}
                            aria-label={title}
                            disabled={disabled}
                          >
                            {action.icon}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalItems > pageSize && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      )}
    </>
  );
}

export default DataTable;