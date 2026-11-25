import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  Eye,
  Printer,
  RefreshCw,
  X,
} from "lucide-react";
import DataTable from "../common/DataTable.jsx";
import SearchBar from "../common/SearchBar.jsx";
import EmptyState from "../common/EmptyState";
import SearchToolbar from "../common/SearchToolbar.jsx";
import LoadingSpinner from "../common/LoadingSpinner.jsx";
import InvoiceModal from "./InvoiceModal.jsx";
import useSearch from "../../hooks/useSearch.js";
import { useExport, exportConfigs } from "../../hooks/useExport.js";
import { getSales } from "../../services/SaleDefinition/saleService.js";
import {
  getSalesReturnById,
  getSalesReturns,
} from "../../services/SaleReturnDefinition/salesReturnService.js";
import { getCustomers } from "../../services/CustomerDefinition/customerService.js";
import { getProducts } from "../../services/ProductDefinition/productService.js";
import {
  salesReturnBaseColumns,
  salesReturnExtraColumns,
} from "../../models/salesReturnColumns.jsx";
import { getSalesReturnSearchFields } from "../../models/salesReturnSearchFields.js";
import { notify } from "../../utils/notify";
import "../../assets/styles/sales/SalesReturnSearch.css";

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

function getReturnId(salesReturn) {
  return (
    salesReturn?.salesReturnId ??
    salesReturn?.SalesReturnId ??
    salesReturn?.saleReturnId ??
    salesReturn?.id
  );
}

function mergeReturnDetails(salesReturn, response) {
  const responseRecord =
    response && typeof response === "object" && !Array.isArray(response)
      ? response
      : {};
  const details = Array.isArray(response)
    ? response
    : responseRecord.details ??
      responseRecord.salesReturnDetails ??
      salesReturn.details;

  if (!Array.isArray(details)) {
    throw new Error("The return details response was not in the expected format.");
  }
  return { ...salesReturn, ...responseRecord, details };
}

function SalesReturnSearch({ onClose }) {
  const [returns, setReturns] = useState([]);
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [showExtraColumns, setShowExtraColumns] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);

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
    data: returns,
    initialFilters: {
      returnNumber: "",
      invoiceNumber: "",
      customerName: "",
      returnType: "",
      dateFrom: "",
      dateTo: "",
    },
    searchFields: [
      { name: "returnNumber", getValue: (item) => item.returnNumber },
      {
        name: "invoiceNumber",
        getValue: (item) =>
          item.originalInvoiceNumber || item.invoiceNumber || "",
      },
      {
        name: "customerName",
        getValue: (item) => item.customerName || item.customerId || "Walk-in",
      },
      {
        name: "returnType",
        type: "exact",
        getValue: (item) => String(item.returnType || "Return").toLowerCase(),
      },
      {
        name: "dateFrom",
        type: "date",
        getValue: (item) => formatLocalDate(item.returnDate),
      },
      {
        name: "dateTo",
        type: "date",
        getValue: (item) => formatLocalDate(item.returnDate),
      },
    ],
  });

  const { handlePrint, handleExportCSV } = useExport({
    config: exportConfigs.salesReturns,
  });

  const saleById = useMemo(
    () => new Map(sales.map((sale) => [String(sale.saleId), sale])),
    [sales]
  );
  const customerById = useMemo(
    () =>
      new Map(
        customers.map((customer) => [String(customer.customerId), customer])
      ),
    [customers]
  );
  const productById = useMemo(
    () =>
      new Map(
        products.map((product) => [String(product.productId), product])
      ),
    [products]
  );

  const searchFields = useMemo(
    () => getSalesReturnSearchFields(),
    []
  );

  const summary = useMemo(
    () => ({
      count: returns.length,
      invoiceLinked: returns.filter((item) => item.saleId != null).length,
      manual: returns.filter(
        (item) => item.isManualReturn === true || item.isManualReturn === 1
      ).length,
      total: returns.reduce((sum, item) => sum + (Number(item.total) || 0), 0),
    }),
    [returns]
  );

  const loadAllData = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [returnsData, salesData, customersData, productsData] =
        await Promise.all([
          getSalesReturns(),
          getSales(),
          getCustomers(),
          getProducts(),
        ]);
      if (returnsData != null && !Array.isArray(returnsData)) {
        throw new Error("The sales returns response was not in the expected format.");
      }
      const loadedSales = salesData || [];
      const loadedCustomers = customersData || [];
      const loadedProducts = productsData || [];
      const loadedSaleById = new Map(
        loadedSales.map((sale) => [String(sale.saleId), sale])
      );
      const loadedCustomerById = new Map(
        loadedCustomers.map((customer) => [
          String(customer.customerId),
          customer,
        ])
      );
      const loadedProductById = new Map(
        loadedProducts.map((product) => [
          String(product.productId),
          product,
        ])
      );
      setReturns(
        (returnsData || []).map((salesReturn) => {
          const sale = loadedSaleById.get(String(salesReturn.saleId));
          const customer = loadedCustomerById.get(
            String(salesReturn.customerId)
          );
          return {
            ...salesReturn,
            invoiceNumber:
              salesReturn.originalInvoiceNumber ||
              sale?.invoiceNumber ||
              (salesReturn.saleId ? `Sale ${salesReturn.saleId}` : "Manual"),
            customerName: customer?.name || sale?.customerName || "",
            details: Array.isArray(salesReturn.details)
              ? salesReturn.details.map((item) => {
                  const product = loadedProductById.get(
                    String(item.productId)
                  );
                  return {
                    ...item,
                    productName:
                      item.productName ||
                      product?.name ||
                      `Product ${item.productId}`,
                    productCode: item.productCode || product?.code || "",
                  };
                })
              : salesReturn.details,
          };
        })
      );
      setSales(loadedSales);
      setCustomers(loadedCustomers);
      setProducts(loadedProducts);
    } catch (error) {
      console.error("Error loading sales returns:", error);
      setLoadError(error.message || "Unable to load return history.");
      notify.error(error.message || "Unable to load return history.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const closeDetails = useCallback(() => {
    setShowReceipt(false);
    setSelectedReturn(null);
  }, []);

  useEffect(() => {
    if (!selectedReturn) return undefined;
    const handleEscape = (event) => {
      if (event.key === "Escape" && !detailsLoading) closeDetails();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [selectedReturn, detailsLoading, closeDetails]);

  async function openReturnDetails(salesReturn) {
    const id = getReturnId(salesReturn);
    if (id == null) {
      notify.error("This return is missing its ID and cannot be opened.");
      return;
    }

    setDetailsLoading(true);
    try {
      let fullReturn = salesReturn;
      if (!Array.isArray(salesReturn.details)) {
        const response = await getSalesReturnById(id);
        fullReturn = mergeReturnDetails(salesReturn, response);
      }
      const sale = saleById.get(String(fullReturn.saleId));
      const customer = customerById.get(String(fullReturn.customerId));
      fullReturn = {
        ...fullReturn,
        invoiceNumber:
          fullReturn.originalInvoiceNumber ||
          sale?.invoiceNumber ||
          (fullReturn.saleId ? `Sale ${fullReturn.saleId}` : "Manual"),
        customerName: customer?.name || sale?.customerName || "Walk-in",
        details: fullReturn.details.map((item) => {
          const product = productById.get(String(item.productId));
          return {
            ...item,
            productName:
              item.productName || product?.name || `Product ${item.productId}`,
            productCode: item.productCode || product?.code || "",
          };
        }),
      };
      setSelectedReturn(fullReturn);
    } catch (error) {
      console.error("Error loading return details:", error);
      notify.error(error.message || "Unable to load return details.");
    } finally {
      setDetailsLoading(false);
    }
  }

  const receiptData = selectedReturn
    ? {
        ...selectedReturn,
        invoiceNumber: selectedReturn.returnNumber || "Return",
        returnNumber: selectedReturn.returnNumber,
        returnDate: selectedReturn.returnDate,
        saleDate: selectedReturn.returnDate,
        subTotal: Number(selectedReturn.total) || 0,
        discount: 0,
        tax: 0,
        total: Number(selectedReturn.total) || 0,
        paidAmount: Number(selectedReturn.total) || 0,
        remainingAmount: 0,
        paymentMethod: "Refund / Return",
        details: selectedReturn.details.map((item) => ({
          ...item,
          quantity: Math.abs(Number(item.quantity) || 0),
          total: Math.abs(Number(item.total) || 0),
        })),
        isReturn: true,
      }
    : null;

  const tableActions = [
    {
      icon: <Eye size={14} strokeWidth={2} />,
      onClick: openReturnDetails,
      title: "View return details",
      className: "btn-outline",
    },
  ];

  if (loading) {
    return (
      <div className="sales-return-search-fullscreen">
        <LoadingSpinner card message="Loading return history..." size="large" />
      </div>
    );
  }

  return (
    <div className="sales-return-search-fullscreen">
      <header className="sales-return-search-header">
        <div className="header-left">
          <button className="btn-back" onClick={onClose} type="button">
            <ArrowLeft size={16} strokeWidth={2} />
            Back to POS
          </button>
          <div className="sales-return-title">
            <h1>
              <ClipboardList size={20} strokeWidth={2} />
              Return history
            </h1>
            <span>Review and reprint completed POS returns</span>
          </div>
        </div>
        <div className="header-right">
          <span className="total-count">{summary.count} returns</span>
          <button
            className="btn btn-outline btn-sm"
            onClick={loadAllData}
            type="button"
            title="Refresh return history"
          >
            <RefreshCw size={14} strokeWidth={2} />
            Refresh
          </button>
        </div>
      </header>

      <main className="sales-return-search-content">
        {loadError ? (
          <div className="sales-return-load-error" role="alert">
            <div>
              <strong>Return history could not be loaded</strong>
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
            <section
              className="sales-return-summary"
              aria-label="Return summary"
            >
              <div>
                <span>Return transactions</span>
                <strong>{summary.count}</strong>
              </div>
              <div>
                <span>Invoice-linked</span>
                <strong>{summary.invoiceLinked}</strong>
              </div>
              <div>
                <span>Manual returns</span>
                <strong>{summary.manual}</strong>
              </div>
              <div>
                <span>Total return value</span>
                <strong>{formatMoney(summary.total)}</strong>
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
              extraColumnsCount={salesReturnExtraColumns.length}
              extraColumnsLabel="Audit details"
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
              columns={
                showExtraColumns
                  ? [...salesReturnBaseColumns, ...salesReturnExtraColumns]
                  : salesReturnBaseColumns
              }
              actions={tableActions}
              defaultPageSize={10}
              emptyMessage={
                returns.length === 0
                  ? "No returns have been recorded yet."
                  : "No returns match these filters."
              }
            />

            <span className="results-count">
              Showing {filteredData.length} of {returns.length} returns
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

      {selectedReturn && (
        <div
          className="sales-return-detail-overlay"
          onClick={(event) => {
            if (event.target === event.currentTarget && !detailsLoading) {
              closeDetails();
            }
          }}
          role="presentation"
        >
          <section
            className="sales-return-detail-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sales-return-detail-title"
          >
            <header className="sales-return-detail-header">
              <div>
                <span>Return transaction</span>
                <h2 id="sales-return-detail-title">
                  {selectedReturn.returnNumber || "Return"}
                </h2>
              </div>
              <div className="sales-return-detail-actions">
                <button
                  className="btn btn-outline btn-sm"
                  type="button"
                  onClick={() => setShowReceipt(true)}
                >
                  <Printer size={15} />
                  Reprint receipt
                </button>
                <button
                  type="button"
                  className="sales-return-detail-close"
                  onClick={closeDetails}
                  aria-label="Close return details"
                >
                  <X size={20} />
                </button>
              </div>
            </header>

            <div className="sales-return-detail-body">
              <div className="sales-return-detail-facts">
                <div>
                  <span>Original invoice</span>
                  <strong>{selectedReturn.invoiceNumber}</strong>
                </div>
                <div>
                  <span>Customer</span>
                  <strong>{selectedReturn.customerName || "Walk-in"}</strong>
                </div>
                <div>
                  <span>Return date</span>
                  <strong>
                    <CalendarDays size={14} />
                    {formatDateTime(selectedReturn.returnDate)}
                  </strong>
                </div>
                <div>
                  <span>Return type</span>
                  <strong>{selectedReturn.returnType || "Return"}</strong>
                </div>
                <div>
                  <span>Processing</span>
                  <strong>
                    {selectedReturn.isManualReturn === true ||
                    selectedReturn.isManualReturn === 1
                      ? "Manual"
                      : "Invoice-linked"}
                  </strong>
                </div>
                {selectedReturn.returnReason && (
                  <div>
                    <span>Reason</span>
                    <strong>{selectedReturn.returnReason}</strong>
                  </div>
                )}
              </div>

              <div className="sales-return-detail-items">
                <h3>Returned items ({selectedReturn.details.length})</h3>
                {selectedReturn.details.length === 0 ? (
                  <EmptyState title="No line items are available for this return." compact />
                ) : (
                  <div className="sales-return-detail-table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Item</th>
                          <th>Qty returned</th>
                          <th>Unit price</th>
                          <th>Reason</th>
                          <th className="numeric">Line total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedReturn.details.map((item, index) => (
                          <tr
                            key={
                              item.salesReturnDetailId ??
                              item.productId ??
                              index
                            }
                          >
                            <td>
                              <strong>{item.productName || "Item"}</strong>
                              {item.productCode && (
                                <span>{item.productCode}</span>
                              )}
                            </td>
                            <td>{Math.abs(Number(item.quantity) || 0)}</td>
                            <td>{formatMoney(item.retailPrice)}</td>
                            <td>{item.reason || "—"}</td>
                            <td className="numeric">
                              {formatMoney(item.total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {selectedReturn.comments && (
                <div className="sales-return-detail-notes">
                  <span>Notes</span>
                  <p>{selectedReturn.comments}</p>
                </div>
              )}
            </div>

            <footer className="sales-return-detail-footer">
              <span>Return value</span>
              <strong>{formatMoney(selectedReturn.total)}</strong>
            </footer>
          </section>
        </div>
      )}

      {detailsLoading && (
        <div className="sales-return-details-loading" role="status">
          <span />
          Loading return details…
        </div>
      )}

      <InvoiceModal
        isOpen={showReceipt && Boolean(receiptData)}
        onClose={() => setShowReceipt(false)}
        saleData={receiptData}
      />
    </div>
  );
}

export default SalesReturnSearch;
