// components/common/Pagination.jsx
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, CornerDownLeft } from "lucide-react";
import "../../assets/styles/common/Pagination.css";

function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  siblingCount = 1,
}) {
  const [goToPage, setGoToPage] = useState("");

  useEffect(() => {
    setGoToPage("");
  }, [currentPage]);

  function getPageRange() {
    const totalPageNumbers = siblingCount * 2 + 3;
    const firstPage = 1;
    const lastPage = totalPages;

    if (totalPages <= totalPageNumbers) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);
    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 1;

    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftRange = Array.from({ length: 3 + 2 * siblingCount }, (_, i) => i + 1);
      return [...leftRange, "...", totalPages];
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightRange = Array.from(
        { length: 3 + 2 * siblingCount },
        (_, i) => totalPages - (3 + 2 * siblingCount - 1) + i
      );
      return [firstPage, "...", ...rightRange];
    }

    if (shouldShowLeftDots && shouldShowRightDots) {
      const middleRange = Array.from(
        { length: 2 * siblingCount + 1 },
        (_, i) => leftSiblingIndex + i
      );
      return [firstPage, "...", ...middleRange, "...", lastPage];
    }

    return [];
  }

  function handleGoToPage(e) {
    e.preventDefault();
    const page = parseInt(goToPage);
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
      setGoToPage("");
    }
  }

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);
  const pageRange = getPageRange();
  const goToValid = goToPage && parseInt(goToPage) >= 1 && parseInt(goToPage) <= totalPages;

  return (
    <div className="pagination-container">
      <div className="pagination-info">
        <span>
          Showing <strong>{startItem}</strong>–<strong>{endItem}</strong> of{" "}
          <strong>{totalItems}</strong> entries
        </span>
      </div>

      <div className="pagination-toolbar">
        {/* Page size */}
        <div className="toolbar-segment">
          <label>Rows</label>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="pagination-select"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        <div className="toolbar-divider" />

        {/* Page navigation */}
        <div className="toolbar-segment nav-segment">
          <button
            className="nav-btn"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Previous page"
          >
            <ChevronLeft size={16} strokeWidth={2} />
          </button>

          <div className="page-pills">
            {pageRange.map((page, index) =>
              page === "..." ? (
                <span key={`dots-${index}`} className="page-dots">
                  ⋯
                </span>
              ) : (
                <button
                  key={page}
                  className={`page-pill ${currentPage === page ? "active" : ""}`}
                  onClick={() => onPageChange(page)}
                  aria-current={currentPage === page}
                >
                  {page}
                </button>
              )
            )}
          </div>

          <button
            className="nav-btn"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label="Next page"
          >
            <ChevronRight size={16} strokeWidth={2} />
          </button>
        </div>

        <div className="toolbar-divider" />

        {/* Go to page */}
        <div className="toolbar-segment go-to-segment">
          <label>Go to</label>
          <input
            type="number"
            min="1"
            max={totalPages}
            value={goToPage}
            onChange={(e) => setGoToPage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleGoToPage(e);
            }}
            className="pagination-input"
            placeholder="Page"
          />
          <button
            className={`go-btn ${goToValid ? "go-btn--ready" : ""}`}
            onClick={handleGoToPage}
            disabled={!goToValid}
            aria-label="Go"
          >
            <CornerDownLeft size={14} strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default Pagination;