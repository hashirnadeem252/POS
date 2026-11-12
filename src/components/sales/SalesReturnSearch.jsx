// components/sales/SalesReturnSearch.jsx
import { useEffect, useState, useMemo } from "react";
import {
  FileEdit,
  Trash2,
  ArrowLeft,
  ClipboardList,
  Plus,
  RotateCcw,
} from "lucide-react";
import DataTable from "../common/DataTable.jsx";
import SearchBar from "../common/SearchBar.jsx";
import SearchToolbar from "../common/SearchToolbar.jsx";
import useSearch from "../../hooks/useSearch.js";
import { useExport, exportConfigs } from "../../hooks/useExport.js";
import {
  getSalesReturns,
  createSalesReturn,
  updateSalesReturn,
  deleteSalesReturn,
} from "../../services/SaleReturnDefinition/salesReturnService.js";
import { getSales } from "../../services/SaleDefinition/saleService.js";
import { getProducts } from "../../services/ProductDefinition/productService.js";
import SalesReturnForm from "../salesreturn/SalesReturnForm.jsx";
import {
  salesReturnBaseColumns,
  salesReturnExtraColumns,
} from "../../models/salesReturnColumns.jsx";
import { getSalesReturnSearchFields } from "../../models/salesReturnSearchFields.js";
import { notify } from "../../utils/notify";  
import "../../assets/styles/sales/SalesReturnSearch.css";
import LoadingSpinner from "../common/LoadingSpinner.jsx";
import ConfirmDialog from "../common/ConfirmDialog";

/**
 * SalesReturnSearch Component
 * Full-screen sales return search view rendered inline inside POS.
 *
 * @param {Function} onClose        - Called when user clicks Back
 * @param {Function} onEditReturn   - Called with return object to edit in POS
 */
function SalesReturnSearch({ onClose, onEditReturn }) {
  // =========================
  // STATE
  // =========================
  const [showExtraColumns, setShowExtraColumns] = useState(false);
  const [returns, setReturns] = useState([]);
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    salesReturn: null,
  });

  // =========================
  // ACTION HANDLERS — delegate to parent
  // =========================
  function goBackToPOS() {
    if (onClose) onClose();
  }

  function loadReturnToPOS(salesReturn) {
    if (onEditReturn) onEditReturn(salesReturn);
  }

  // =========================
  // EXPORT HOOK
  // =========================
  const { handlePrint, handleExportCSV } = useExport({
    config: exportConfigs.salesReturns,
  });

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
    data: returns,
    initialFilters: {
      returnNumber: "",
      saleId: "",
      customerId: "",
      fromDate: "",
      toDate: "",
    },
    searchFields: [
      { name: "returnNumber", getValue: (item) => item.returnNumber },
      { name: "saleId", type: "exact", getValue: (item) => item.saleId },
      { name: "customerId", type: "exact", getValue: (item) => item.customerId },
      { name: "fromDate", type: "date", getValue: (item) => item.returnDate },
      { name: "toDate", type: "date", getValue: (item) => item.returnDate },
    ],
  });

  // =========================
  // COMPUTED COLUMNS
  // =========================
  const columns = useMemo(() => {
    const base = [...salesReturnBaseColumns];
    if (showExtraColumns) {
      return [...base, ...salesReturnExtraColumns];
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
      const [returnsData, salesData, productsData] = await Promise.all([
        getSalesReturns(),
        getSales(),
        getProducts(),
      ]);
      setReturns(returnsData || []);
      setSales(salesData || []);
      setProducts(productsData || []);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }

  // =========================
  // HANDLERS
  // =========================
  function handleAddReturn() {
    setSelectedReturn(null);
    setShowForm(true);
  }

  function handleEditReturn(salesReturn) {
    loadReturnToPOS(salesReturn);
  }

  function handleRowDoubleClick(salesReturn) {
    loadReturnToPOS(salesReturn);
  }

  async function handleSave(formData) {
    try {
      if (selectedReturn) {
        await updateSalesReturn(selectedReturn.salesReturnId, formData);
        setReturns((current) =>
          current.map((r) =>
            r.salesReturnId === selectedReturn.salesReturnId
              ? { ...r, ...formData }
              : r
          )
        );
      } else {
        const newReturn = await createSalesReturn(formData);
        setReturns((current) => [...current, newReturn]);
      }
      setShowForm(false);
      setSelectedReturn(null);
      notify.success("Sales Return saved successfully!");
    } catch (error) {
      console.error("Error saving sales return:", error);
      notify.error("Failed to save sales return. Please try again.");
    }
  }

  function handleDelete(salesReturn) {
    if (!salesReturn) {
      notify.warning("Sales Return not found");
      return;
    }
    setConfirmState({ isOpen: true, salesReturn });
  }
  
  async function confirmDeleteReturn() {
    const salesReturn = confirmState.salesReturn;
    if (!salesReturn) return;
  
    try {
      await deleteSalesReturn(salesReturn.salesReturnId);
      setReturns((current) =>
        current.filter((r) => r.salesReturnId !== salesReturn.salesReturnId)
      );
      notify.success("Sales Return deleted successfully");
    } catch (error) {
      console.error("Error deleting sales return:", error);
      notify.error("Failed to delete sales return. Please try again");
    } finally {
      setConfirmState({ isOpen: false, salesReturn: null });
    }
  }

  function handleCancel() {
    setShowForm(false);
    setSelectedReturn(null);
  }

  function toggleExtraColumns() {
    setShowExtraColumns(!showExtraColumns);
  }

  // =========================
  // TABLE ACTIONS
  // =========================
  const tableActions = [
    {
      icon: <FileEdit size={14} strokeWidth={2} />,
      onClick: handleEditReturn,
      title: "Edit Return",
      className: "btn-primary",
    },
    {
      icon: <Trash2 size={14} strokeWidth={2} />,
      onClick: handleDelete,
      title: "Delete Return",
      className: "btn-danger",
    },
  ];

  const searchFields = getSalesReturnSearchFields(sales);

  // =========================
  // LOADING STATE
  // =========================
  if (loading) {
    return (
      <div className="sales-return-search-fullscreen">
        <LoadingSpinner
          card={true}
          message="Loading sales returns data..."
          size="large"
        />
      </div>
    );
  }

  // =========================
  // RENDER
  // =========================
  return (
    <div className="sales-return-search-fullscreen">
      {/* Header */}
      <div className="sales-return-search-header">
        <div className="header-left">
          <button className="btn-back" onClick={goBackToPOS}>
            <ArrowLeft size={16} strokeWidth={2} />
            Back to POS
          </button>
          <h1>
            <ClipboardList size={20} strokeWidth={2} />
            Sales Returns
          </h1>
          <span className="total-count">
            {returns.length} Total Returns
          </span>
        </div>
        <div className="header-right">
          <button
            className="btn btn-primary btn-sm"
            onClick={handleAddReturn}
          >
            <Plus size={14} strokeWidth={2} />
            Add Return
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="sales-return-search-content">
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
          emptyMessage="No sales returns found"
        />

        <span className="results-count">
          Showing {filteredData.length} of {returns.length} returns
          {activeFilterCount > 0 && (
            <span className="filter-info">
              {" "}
              (Filtered by {activeFilterCount} criteria)
            </span>
          )}
        </span>
      </div>

      {/* Add Return Form Modal */}
      {showForm && (
        <div className="form-overlay">
          <div className="form-container">
            <SalesReturnForm
              salesReturn={selectedReturn}
              onClose={handleCancel}
              onSave={handleSave}
              products={products}
              sales={sales}
            />
          </div>
        </div>
      )}
      <ConfirmDialog
  isOpen={confirmState.isOpen}
  onClose={() => setConfirmState({ isOpen: false, salesReturn: null })}
  onConfirm={confirmDeleteReturn}
  title="Delete Sales Return?"
  message={`Are you sure you want to delete return "${confirmState.salesReturn?.returnNumber}"?\n\nThis action cannot be undone.`}
  confirmText="Delete Return"
  variant="danger"
/>
    </div>
  );
}

export default SalesReturnSearch;