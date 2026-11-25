import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  Eye,
  FileEdit,
  Printer,
  RefreshCw,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import DataTable from "../common/DataTable.jsx";
import SearchBar from "../common/SearchBar.jsx";
import EmptyState from "../common/EmptyState";
import SearchToolbar from "../common/SearchToolbar.jsx";
import LoadingSpinner from "../common/LoadingSpinner.jsx";
import ConfirmDialog from "../common/ConfirmDialog";
import InvoiceModal from "./InvoiceModal.jsx";
import useSearch from "../../hooks/useSearch.js";
import { useExport, exportConfigs } from "../../hooks/useExport.js";
import {
  deleteSale,
  getSaleDetails,
  getSales,
} from "../../services/SaleDefinition/saleService.js";
import {
  salesBaseColumns,
  salesExtraColumns,
} from "../../models/salesColumns.jsx";
import { getSalesSearchFields } from "../../models/salesSearchFields.js";
import { notify } from "../../utils/notify";
import "../../assets/styles/sales/SalesSearch.css";

function getStatus(sale) {
  return String(sale?.status || "draft").trim().toLowerCase();
}

function formatMoney(value) {
  const amount = Number(value);
  return `PKR ${(Number.isFinite(amount) ? amount : 0).toLocaleString("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

function formatLocalDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function mergeSaleDetails(sale, response) {
  const responseRecord =
    response && typeof response === "object" && !Array.isArray(response)
      ? response
      : {};
  const details = Array.isArray(response)
    ? response
    : responseRecord.details ?? responseRecord.saleDetails ?? sale.details;

  if (!Array.isArray(details)) {
    throw new Error("The sale details response was not in the expected format.");
  }

  return { ...sale, ...responseRecord, details };
}

/**
 * Full-screen sales history view rendered inline inside POS.
 */
function SalesSearch({ onClose, onEditSale, onReturnSale }) {
  const [showExtraColumns, setShowExtraColumns] = useState(false);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedSale, setSelectedSale] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [deletingSale, setDeletingSale] = useState(false);
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    sale: null,
  });

  const {
    filters,
    filteredData,
    showSearch,
    activeFilterCount,
    handleFilterChange,
    handleSearch,
    handleReset,
    toggleSearch,
  } = useSearch({
    data: sales,
    initialFilters: {
      invoiceNumber: "",
      customerName: "",
      salesPersonName: "",
      status: "",
      paymentMethod: "",
      dateFrom: "",
      dateTo: "",
    },
    searchFields: [
      { name: "invoiceNumber", getValue: (sale) => sale.invoiceNumber },
      {
        name: "customerName",
        getValue: (sale) =>
          sale.customerName || sale.customerId || "Walk-in",
      },
      {
        name: "salesPersonName",
        getValue: (sale) => sale.salesPersonName || sale.salesPersonId,
      },
      {
        name: "status",
        type: "exact",
        getValue: (sale) => getStatus(sale),
      },
      {
        name: "paymentMethod",
        type: "exact",
        getValue: (sale) => sale.paymentMethod,
      },
      {
        name: "dateFrom",
        type: "date",
        getValue: (sale) => formatLocalDate(sale.saleDate),
      },
      {
        name: "dateTo",
        type: "date",
        getValue: (sale) => formatLocalDate(sale.saleDate),
      },
    ],
  });

  const { handlePrint, handleExportCSV } = useExport({
    config: exportConfigs.sales,
  });

  const columns = useMemo(() => {
    return showExtraColumns
      ? [...salesBaseColumns, ...salesExtraColumns]
      : salesBaseColumns;
  }, [showExtraColumns]);

  const searchFields = useMemo(() => getSalesSearchFields(), []);

  const summary = useMemo(() => {
    const completed = sales.filter((sale) => getStatus(sale) === "completed");
    return {
      total: sales.length,
      completed: completed.length,
      revenue: completed.reduce((sum, sale) => sum + (Number(sale.total) || 0), 0),
      outstanding: completed.reduce(
        (sum, sale) => sum + (Number(sale.remainingAmount) || 0),
        0
      ),
    };
  }, [sales]);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const salesData = await getSales();
      if (salesData != null && !Array.isArray(salesData)) {
        throw new Error("The sales response was not in the expected format.");
      }
      setSales(salesData || []);
    } catch (error) {
      console.error("Error loading sales:", error);
      setLoadError(error.message || "Unable to load sales. Please try again.");
      notify.error(error.message || "Unable to load sales.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const closeSaleDetails = useCallback(() => {
    setShowReceipt(false);
    setSelectedSale(null);
  }, []);

  useEffect(() => {
    if (!selectedSale) return undefined;
    const handleEscape = (event) => {
      if (event.key === "Escape" && !detailsLoading) closeSaleDetails();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [selectedSale, detailsLoading, closeSaleDetails]);

  async function getCompleteSale(sale) {
    if (Array.isArray(sale.details)) return sale;
    if (sale.saleId == null) {
      throw new Error("This sale is missing its ID and cannot be opened.");
    }
    return mergeSaleDetails(sale, await getSaleDetails(sale.saleId));
  }

  async function openSaleDetails(sale) {
    if (!sale || sale.saleId == null) {
      notify.error("This sale is missing its ID and cannot be opened.");
      return;
    }

    closeSaleDetails();
    setDetailsLoading(true);
    try {
      const response = await getSaleDetails(sale.saleId);
      setSelectedSale(mergeSaleDetails(sale, response));
    } catch (error) {
      console.error("Error loading sale details:", error);
      notify.error(error.message || "Unable to load sale details.");
    } finally {
      setDetailsLoading(false);
    }
  }

  async function loadSaleToPOS(sale) {
    if (getStatus(sale) !== "draft") {
      notify.warning("Only draft sales can be edited.");
      return;
    }
    try {
      const completeSale = await getCompleteSale(sale);
      onEditSale?.(completeSale);
    } catch (error) {
      console.error("Error preparing sale for editing:", error);
      notify.error(error.message || "Unable to open this sale for editing.");
    }
  }

  async function loadSaleForReturn(sale) {
    if (getStatus(sale) !== "completed") {
      notify.warning("Only completed sales can be returned.");
      return;
    }
    try {
      const completeSale = await getCompleteSale(sale);
      onReturnSale?.(completeSale);
    } catch (error) {
      console.error("Error preparing sale for return:", error);
      notify.error(error.message || "Unable to load this sale for return.");
    }
  }

  function handleDelete(sale) {
    if (!sale) {
      notify.warning("Sale not found.");
      return;
    }
    if (getStatus(sale) === "completed") {
      notify.warning(
        `Cannot delete "${sale.invoiceNumber}" because it is completed. Process a return instead.`
      );
      return;
    }
    setConfirmState({ isOpen: true, sale });
  }

  async function confirmDeleteSale() {
    const sale = confirmState.sale;
    if (!sale) return;
    if (sale.saleId == null) {
      notify.error("This sale is missing its ID and cannot be deleted.");
      setConfirmState({ isOpen: false, sale: null });
      return;
    }

    setDeletingSale(true);
    try {
      await deleteSale(sale.saleId);
      setSales((current) =>
        current.filter((item) => item.saleId !== sale.saleId)
      );
      notify.success("Sale deleted successfully.");
    } catch (error) {
      console.error("Error deleting sale:", error);
      notify.error(error.message || "Failed to delete the sale.");
    } finally {
      setDeletingSale(false);
      setConfirmState({ isOpen: false, sale: null });
    }
  }

  const tableActions = [
    {
      icon: <Eye size={14} strokeWidth={2} />,
      onClick: openSaleDetails,
      title: "View sale details",
      className: "btn-outline",
    },
    {
      icon: <FileEdit size={14} strokeWidth={2} />,
      onClick: loadSaleToPOS,
      title: "Edit draft sale",
      isDisabled: (sale) => getStatus(sale) !== "draft",
      getTitle: (sale) =>
        getStatus(sale) === "draft"
          ? "Edit draft sale"
          : "Only draft sales can be edited",
      className: "btn-primary",
    },
    {
      icon: <RotateCcw size={14} strokeWidth={2} />,
      onClick: loadSaleForReturn,
      title: "Return completed sale",
      isDisabled: (sale) => getStatus(sale) !== "completed",
      getTitle: (sale) =>
        getStatus(sale) === "completed"
          ? "Return completed sale"
          : "Only completed sales can be returned",
      className: "btn-warning",
    },
    {
      icon: <Trash2 size={14} strokeWidth={2} />,
      onClick: handleDelete,
      title: "Delete sale",
      isDisabled: (sale) => getStatus(sale) === "completed",
      getTitle: (sale) =>
        getStatus(sale) === "completed"
          ? "Completed sales cannot be deleted; process a return instead"
          : "Delete sale",
      className: "btn-danger",
    },
  ];

  if (loading) {
    return (
      <div className="sales-search-fullscreen">
        <LoadingSpinner card={true} message="Loading sales..." size="large" />
      </div>
    );
  }

  return (
    <div className="sales-search-fullscreen">
      <header className="sales-search-header">
        <div className="header-left">
          <button className="btn-back" onClick={onClose} type="button">
            <ArrowLeft size={16} strokeWidth={2} />
            Back to POS
          </button>
          <div className="sales-search-title">
            <h1>
              <ClipboardList size={20} strokeWidth={2} />
              Sales history
            </h1>
            <span>Review, find, and manage POS transactions</span>
          </div>
        </div>
        <div className="header-right">
          <span className="total-count">{summary.total} sales</span>
          <button
            className="btn btn-outline btn-sm"
            onClick={loadAllData}
            type="button"
            title="Refresh sales"
          >
            <RefreshCw size={14} strokeWidth={2} />
            Refresh
          </button>
        </div>
      </header>

      <main className="sales-search-content">
        {loadError ? (
          <div className="sales-load-error" role="alert">
            <div>
              <strong>Sales could not be loaded</strong>
              <span>{loadError}</span>
            </div>
            <button
              className="btn btn-primary"
              onClick={loadAllData}
              type="button"
            >
              <RefreshCw size={15} />
              Try again
            </button>
          </div>
        ) : (
          <>
            <section className="sales-summary" aria-label="Sales summary">
              <div className="sales-summary-card">
                <span>Total transactions</span>
                <strong>{summary.total}</strong>
              </div>
              <div className="sales-summary-card">
                <span>Completed sales</span>
                <strong>{summary.completed}</strong>
              </div>
              <div className="sales-summary-card">
                <span>Completed revenue</span>
                <strong>{formatMoney(summary.revenue)}</strong>
              </div>
              <div className="sales-summary-card">
                <span>Outstanding balance</span>
                <strong>{formatMoney(summary.outstanding)}</strong>
              </div>
            </section>

            <SearchToolbar
              showSearch={showSearch}
              onToggleSearch={toggleSearch}
              activeFilterCount={activeFilterCount}
              showExtraColumns={showExtraColumns}
              onToggleExtraColumns={() =>
                setShowExtraColumns((current) => !current)
              }
              extraColumnsCount={salesExtraColumns.length}
              onPrint={() => handlePrint(filteredData)}
              onExportCSV={() => handleExportCSV(filteredData)}
            />

            <SearchBar
              fields={searchFields}
              filters={filters}
              onFilterChange={handleFilterChange}
              onSearch={handleSearch}
              onReset={handleReset}
              isOpen={showSearch}
            />

            <DataTable
              data={filteredData}
              columns={columns}
              actions={tableActions}
              defaultPageSize={10}
              emptyMessage={
                sales.length === 0
                  ? "No sales have been recorded yet."
                  : "No sales match these filters."
              }
            />

            <span className="results-count">
              Showing {filteredData.length} of {sales.length} sales
              {activeFilterCount > 0 && (
                <span className="filter-info">
                  {" "}
                  · {activeFilterCount} active{" "}
                  {activeFilterCount === 1 ? "filter" : "filters"}
                </span>
              )}
            </span>
          </>
        )}
      </main>

      {selectedSale && (
        <div
          className="sales-detail-overlay"
          onClick={(event) => {
            if (event.target === event.currentTarget && !detailsLoading) {
              closeSaleDetails();
            }
          }}
          role="presentation"
        >
          <section
            className="sales-detail-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sales-detail-title"
          >
            <header className="sales-detail-header">
              <div>
                <span className="sales-detail-eyebrow">Transaction details</span>
                <h2 id="sales-detail-title">
                  {selectedSale.invoiceNumber || "Sale"}
                </h2>
              </div>
              <div className="sales-detail-actions">
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setShowReceipt(true)}
                >
                  <Printer size={15} />
                  Receipt
                </button>
                <button
                  type="button"
                  className="sales-detail-close"
                  onClick={closeSaleDetails}
                  aria-label="Close sale details"
                >
                  <X size={20} />
                </button>
              </div>
            </header>

            <div className="sales-detail-body">
              <div className="sales-detail-facts">
                <div>
                  <span>Customer</span>
                  <strong>{selectedSale.customerName || "Walk-in"}</strong>
                </div>
                <div>
                  <span>Sales person</span>
                  <strong>{selectedSale.salesPersonName || "—"}</strong>
                </div>
                <div>
                  <span>Date and time</span>
                  <strong>
                    <CalendarDays size={14} />
                    {formatDateTime(selectedSale.saleDate)}
                  </strong>
                </div>
                <div>
                  <span>Status</span>
                  <strong
                    className={`sales-detail-status ${getStatus(selectedSale)}`}
                  >
                    {selectedSale.status || "Draft"}
                  </strong>
                </div>
                <div>
                  <span>Payment method</span>
                  <strong>{selectedSale.paymentMethod || "—"}</strong>
                </div>
              </div>

              <div className="sales-detail-items">
                <h3>Items ({selectedSale.details.length})</h3>
                {selectedSale.details.length === 0 ? (
                  <EmptyState title="No line items are available for this sale." compact />
                ) : (
                  <div className="sales-detail-table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Item</th>
                          <th>Qty</th>
                          <th>Unit price</th>
                          <th className="numeric">Line total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedSale.details.map((item, index) => {
                          const quantity = Number(item.quantity) || 0;
                          const price = Number(item.retailPrice) || 0;
                          const lineTotal =
                            item.total == null
                              ? quantity * price
                              : Number(item.total) || 0;
                          return (
                            <tr
                              key={
                                item.saleDetailId ?? item.productId ?? index
                              }
                            >
                              <td>{item.productName || item.name || "Item"}</td>
                              <td>{quantity}</td>
                              <td>{formatMoney(price)}</td>
                              <td className="numeric">
                                {formatMoney(lineTotal)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {selectedSale.comments && (
                <div className="sales-detail-notes">
                  <span>Notes</span>
                  <p>{selectedSale.comments}</p>
                </div>
              )}
            </div>

            <footer className="sales-detail-footer">
              <div>
                <span>Subtotal</span>
                <strong>{formatMoney(selectedSale.subTotal)}</strong>
              </div>
              <div>
                <span>Discount</span>
                <strong>{formatMoney(selectedSale.discount)}</strong>
              </div>
              <div>
                <span>Tax</span>
                <strong>{formatMoney(selectedSale.tax)}</strong>
              </div>
              <div>
                <span>Total</span>
                <strong>{formatMoney(selectedSale.total)}</strong>
              </div>
              <div>
                <span>Paid</span>
                <strong>{formatMoney(selectedSale.paidAmount)}</strong>
              </div>
              <div>
                <span>Balance</span>
                <strong>{formatMoney(selectedSale.remainingAmount)}</strong>
              </div>
            </footer>
          </section>
        </div>
      )}

      {detailsLoading && (
        <div className="sales-details-loading" role="status">
          <span className="sales-details-spinner" />
          Loading transaction details…
        </div>
      )}

      <InvoiceModal
        isOpen={showReceipt && Boolean(selectedSale)}
        onClose={() => setShowReceipt(false)}
        saleData={selectedSale}
      />

      <ConfirmDialog
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState({ isOpen: false, sale: null })}
        onConfirm={confirmDeleteSale}
        loading={deletingSale}
        title="Delete sale?"
        message={`Are you sure you want to delete sale "${confirmState.sale?.invoiceNumber}"? This action cannot be undone.`}
        confirmText="Delete sale"
        variant="danger"
      />
    </div>
  );
}

export default SalesSearch;
