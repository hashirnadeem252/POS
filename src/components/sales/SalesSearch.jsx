// pages/SalesSearch.jsx
import { useEffect, useState, useMemo } from "react";
import {
  FileEdit,
  RotateCcw,
  Trash2,
  ArrowLeft,
  Printer,
  ClipboardList,
} from "lucide-react";
import DataTable from "../common/DataTable.jsx";
import SearchBar from "../common/SearchBar.jsx";
import SearchToolbar from "../common/SearchToolbar.jsx";
import useSearch from "../../hooks/useSearch.js";
import { useExport, exportConfigs } from "../../hooks/useExport.js";
import { getSales, deleteSale } from "../../services/SaleDefinition/saleService.js";
import { getCustomers } from "../../services/CustomerDefinition/customerService.js";
import { getSalesPersons } from "../../services/SalesPersonDefinition/salesPersonService.js";
import { getProducts } from "../../services/ProductDefinition/productService.js";
import {
  salesBaseColumns,
  salesExtraColumns,
} from "../../models/salesColumns.jsx";
import { getSalesSearchFields } from "../../models/salesSearchFields.js";
import { notify } from "../../utils/notify";  
import "../../assets/styles/sales/SalesSearch.css";
import LoadingSpinner from "../common/LoadingSpinner.jsx";
import ConfirmDialog from "../common/ConfirmDialog";

/**
 * SalesSearch Component
 * Full-screen sales search view rendered inline inside POS.
 *
 * @param {Function} onClose     - Called when user clicks Back
 * @param {Function} onEditSale  - Called with sale object to edit in POS
 * @param {Function} onReturnSale - Called with sale object to return in POS
 */
function SalesSearch({ onClose, onEditSale, onReturnSale }) {
  // =========================
  // STATE
  // =========================
  const [showExtraColumns, setShowExtraColumns] = useState(false);
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [salesPersons, setSalesPersons] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    sale: null,
    mode: null,   // "delete" | "editOrReturn"
  });

  // =========================
  // ACTION HANDLERS — delegate to parent
  // =========================
  function loadSaleToPOS(sale) {
    if (onEditSale) onEditSale(sale);
  }

  function loadSaleForReturn(sale) {
    if (onReturnSale) onReturnSale(sale);
  }

  function goBackToPOS() {
    if (onClose) onClose();
  }

  // =========================
  // SEARCH HOOK
  // =========================
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
      customerId: "",
      salesPersonId: "",
      status: "",
      fromDate: "",
      toDate: "",
    },
    searchFields: [
      { name: "invoiceNumber", getValue: (item) => item.invoiceNumber },
      { name: "customerId", type: "exact", getValue: (item) => item.customerId },
      { name: "salesPersonId", type: "exact", getValue: (item) => item.salesPersonId },
      { name: "status", type: "exact", getValue: (item) => item.status },
      { name: "fromDate", type: "date", getValue: (item) => item.saleDate },
      { name: "toDate", type: "date", getValue: (item) => item.saleDate },
    ],
  });

  // =========================
  // EXPORT HOOK
  // =========================
  const { handlePrint, handleExportCSV } = useExport({
    config: exportConfigs.sales,
  });

  // =========================
  // COMPUTED COLUMNS
  // =========================
  const columns = useMemo(() => {
    const base = [...salesBaseColumns];
    if (showExtraColumns) {
      return [...base, ...salesExtraColumns];
    }
    return base;
  }, [showExtraColumns]);

  // =========================
  // LOAD DATA
  // =========================
  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    setLoading(true);
    try {
      const [salesData, customersData, personsData, productsData] =
        await Promise.all([
          getSales(),
          getCustomers(),
          getSalesPersons(),
          getProducts(),
        ]);
      setSales(salesData || []);
      setCustomers(customersData || []);
      setSalesPersons(personsData || []);
      setProducts(productsData || []);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }

  // =========================
  // DELETE SALE
  // =========================
  // Opens the confirm dialog
  function handleDelete(sale) {
    if (!sale) {
      notify.warning("Sale not found");
      return;
    }
    if (sale.status?.toLowerCase() === "completed") {
      notify.warning(`Cannot delete "${sale.invoiceNumber}" — it's already completed. Process a return instead.`);
      return;
    }
    setConfirmState({ isOpen: true, sale, mode: "delete" });
  }
  
  // Actually deletes
  async function confirmDeleteSale() {
    const sale = confirmState.sale;
    if (!sale) return;
  
    try {
      await deleteSale(sale.saleId);
      setSales((current) => current.filter((s) => s.saleId !== sale.saleId));
      notify.success("Sale deleted successfully");
    } catch (error) {
      console.error("Error deleting sale:", error);
      if (error.message?.includes("Cannot delete a completed sale")) {
        notify.error(`Cannot delete "${sale.invoiceNumber}" — already completed`);
      } else if (error.message?.includes("foreign key") || error.message?.includes("reference")) {
        notify.error(`Cannot delete "${sale.invoiceNumber}" — it has related records`);
      } else {
        notify.error(`Failed to delete: ${error.message || "Please try again"}`);
      }
    } finally {
      setConfirmState({ isOpen: false, sale: null, mode: null });
    }
  }

  // =========================
  // ROW DOUBLE CLICK — Edit or Return
  // =========================
  function handleRowDoubleClick(sale) {
    // Always open for edit — use the Return action button for returns
    loadSaleToPOS(sale);
  }

  // =========================
  // TOGGLE EXTRA COLUMNS
  // =========================
  function toggleExtraColumns() {
    setShowExtraColumns(!showExtraColumns);
  }

  // =========================
  // TABLE ACTIONS
  // =========================
  const tableActions = [
    {
      icon: <FileEdit size={14} strokeWidth={2} />,
      onClick: (row) => {
        if (row.status?.toLowerCase() === "completed") {
          notify.warning("Cannot edit a completed sale.");
          return;
        }
        loadSaleToPOS(row);
      },
      title: "Edit Sale",
      className: "btn-primary",
    },
    {
      icon: <RotateCcw size={14} strokeWidth={2} />,
      onClick: loadSaleForReturn,
      title: "Return Sale",
      className: "btn-warning",
    },
    {
      icon: <Trash2 size={14} strokeWidth={2} />,
      onClick: (row) => {
        if (row.status?.toLowerCase() === "completed") {
          notify.warning("Cannot delete a completed sale. Please process a return instead.");
          return;
        }
        handleDelete(row);
      },
      title: "Delete Sale",
      className: "btn-danger",
    },
  ];

  const searchFields = getSalesSearchFields(customers, salesPersons);

  // =========================
  // LOADING STATE
  // =========================
  if (loading) {
    return (
      <div className="sales-search-fullscreen">
        <LoadingSpinner
          card={true}
          message="Loading sales data..."
          size="large"
        />
      </div>
    );
  }

  // =========================
  // RENDER
  // =========================
  return (
    <div className="sales-search-fullscreen">
      {/* Header */}
      <div className="sales-search-header">
        <div className="header-left">
          <button className="btn-back" onClick={goBackToPOS}>
            <ArrowLeft size={16} strokeWidth={2} />
            Back to POS
          </button>
          <h1>
            <ClipboardList size={20} strokeWidth={2} />
            Search Sales
          </h1>
          <span className="total-count">{sales.length} Total Sales</span>
        </div>
        <div className="header-right">
          <button
            className="btn btn-outline btn-sm"
            onClick={() => window.print()}
          >
            <Printer size={14} strokeWidth={2} />
            Print
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="sales-search-content">
        <SearchToolbar
          showSearch={showSearch}
          onToggleSearch={toggleSearch}
          activeFilterCount={activeFilterCount}
          showExtraColumns={showExtraColumns}
          onToggleExtraColumns={toggleExtraColumns}
          extraColumnsCount={2}
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
          onRowDoubleClick={handleRowDoubleClick}
          defaultPageSize={10}
          emptyMessage="No sales found"
        />

        <span className="results-count">
          Showing {filteredData.length} of {sales.length} sales
          {activeFilterCount > 0 && (
            <span className="filter-info">
              {" "}
              (Filtered by {activeFilterCount} criteria)
            </span>
          )}
        </span>
      </div>
      <ConfirmDialog
  isOpen={confirmState.isOpen && confirmState.mode === "delete"}
  onClose={() => setConfirmState({ isOpen: false, sale: null, mode: null })}
  onConfirm={confirmDeleteSale}
  title="Delete Sale?"
  message={`Are you sure you want to delete sale "${confirmState.sale?.invoiceNumber}"?\n\nThis action cannot be undone.`}
  confirmText="Delete Sale"
  variant="danger"
/>
    </div>
  );
}

export default SalesSearch;