// pages/Purchases/PurchaseDefinition.jsx
import { useEffect, useState, useMemo } from "react";
import {
  Package,
  FileEdit,
  Plus,
  Edit,
  Trash2,
  X,
} from "lucide-react";
import DataTable from "../components/common/DataTable.jsx";

import PageTabs from "../components/common/PageTabs.jsx";
import SearchBar from "../components/common/SearchBar.jsx";
import SearchToolbar from "../components/common/SearchToolbar.jsx";
import useSearch from "../hooks/useSearch.js";
import { useExport, exportConfigs } from "../hooks/useExport.js";
import PurchaseForm from "../components/purchases/PurchaseForm.jsx";
import {
  getPurchases,
  getPurchaseById,
  createPurchase,
  updatePurchase,
  deletePurchase,
  updatePurchaseStatus,
} from "../services/PurchaseDefinition/purchaseService.js";
import { getSuppliers } from "../services/SupplierDefinition/supplierService.js";
import {
  purchaseBaseColumns,
  purchaseExtraColumns,
} from "../models/purchaseColumns.jsx";
import { getPurchaseSearchFields } from "../models/purchaseSearchFields.js";
import { getProducts } from "../services/ProductDefinition/productService.js";
import { notify } from "../utils/notify";
import "../assets/styles/purchases/PurchaseDefinition.css";

function PurchaseDefinition() {
  // =========================
  // STATE
  // =========================
  const [activeTab, setActiveTab] = useState(0);
  const [editingPurchase, setEditingPurchase] = useState(null);
  const [showExtraColumns, setShowExtraColumns] = useState(false);

  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);

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
    data: purchases,
    initialFilters: {
      purchaseNumber: "",
      supplierId: "",
      status: "",
      dateFrom: "",
      dateTo: "",
    },
    searchFields: [
      { name: "purchaseNumber", getValue: (item) => item.purchaseNumber },
      { name: "supplierId", type: "exact", getValue: (item) => item.supplierId },
      { name: "status", type: "exact", getValue: (item) => item.status },
      { name: "dateFrom", type: "date", getValue: (item) => item.purchaseDate },
      { name: "dateTo", type: "date", getValue: (item) => item.purchaseDate },
    ],
  });

  // =========================
  // EXPORT HOOK
  // =========================
  const { handlePrint, handleExportCSV } = useExport({
    config: exportConfigs.purchases,
  });

  // =========================
  // COMPUTED COLUMNS
  // =========================
  const columns = useMemo(() => {
    const base = [...purchaseBaseColumns];
    if (showExtraColumns) {
      return [...base, ...purchaseExtraColumns];
    }
    return base;
  }, [showExtraColumns]);

  // =========================
  // LOAD DATA
  // =========================
  useEffect(() => {
    loadPurchases();
    loadSuppliers();
    loadProducts();
  }, []);

  async function loadPurchases() {
    try {
      const data = await getPurchases();
      setPurchases(data);
    } catch (error) {
      console.error("Error loading purchases:", error);
    }
  }

  async function loadSuppliers() {
    try {
      const data = await getSuppliers();
      setSuppliers(data);
    } catch (error) {
      console.error("Error loading suppliers:", error);
    }
  }

  async function loadProducts() {
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      console.error("Error loading products:", error);
    }
  }

  // =========================
  // HANDLERS
  // =========================
  function handleAddPurchase() {
    setEditingPurchase(null);
    setActiveTab(1);
  }

  async function handleEditPurchase(purchase) {
    try {
      const data = await getPurchaseById(purchase.purchaseId);
      setEditingPurchase(data);
      setActiveTab(1);
    } catch (error) {
      console.error("Error loading purchase:", error);
      notify.error("Failed to load purchase details.");
    }
  }

  function handleRowDoubleClick(purchase) {
    handleEditPurchase(purchase);
  }

  async function handleSave(formData) {
    try {
      if (editingPurchase) {
        await updatePurchase(editingPurchase.purchaseId, formData);
        notify.success("✅ Purchase updated successfully");
      } else {
        await createPurchase(formData);
        notify.success("✅ Purchase created successfully");
      }

      // ✅ PROFESSIONAL FIX: Re-fetch from database
      await loadPurchases();

      setActiveTab(0);
      setEditingPurchase(null);
    } catch (error) {
      console.error("Error saving purchase:", error);
      notify.error("Failed to save purchase. Please try again.");
    }
  }

  // =========================
  // DELETE PURCHASE
  // =========================
  async function handleDeletePurchase(purchase) {
    if (!purchase) {
      notify.warning("Purchase not found.");
      return;
    }

    const purchaseNumber = purchase.purchaseNumber || "Unnamed Purchase";
    const purchaseId = purchase.purchaseId;
    const status = purchase.status || "Pending";
    const isCancelled = status.toLowerCase() === "cancelled";

    // If already cancelled, ask for permanent delete
    if (isCancelled) {
      const confirmed = window.confirm(
        `"${purchaseNumber}" is already CANCELLED.\n\n` +
          `Would you like to PERMANENTLY delete it from the system?\n` +
          `⚠️ This action cannot be undone.`
      );

      if (confirmed) {
        try {
          await deletePurchase(purchaseId);
          setPurchases((current) =>
            current.filter((p) => p.purchaseId !== purchaseId)
          );
          notify.success("✅ Purchase permanently deleted successfully!");
          return;
        } catch (error) {
          console.error("Error deleting purchase:", error);
          notify.error("❌ Failed to delete purchase. Please try again.");
          return;
        }
      }
      return;
    }

    // Show confirmation with clear message
    const message =
      `⚠️ Delete Purchase\n\n` +
      `Purchase: ${purchaseNumber}\n` +
      `Status: ${status}\n\n` +
      `This purchase will be:\n` +
      `• Marked as CANCELLED if it has associated GRNs\n` +
      `• Permanently DELETED if no GRNs exist\n\n` +
      `Do you want to proceed?`;

    if (!window.confirm(message)) return;

    try {
      await deletePurchase(purchaseId);
      await loadPurchases();
      notify.success("✅ Purchase processed successfully!");
    } catch (error) {
      console.error("Error deleting purchase:", error);

      if (
        error.message?.includes("REFERENCE") ||
        error.message?.includes("foreign")
      ) {
        notify.error(
          "❌ Cannot delete this purchase.\n\n" +
            `Purchase: ${purchaseNumber}\n\n` +
            "This purchase is being used in GRN records.\n" +
            "It has been marked as CANCELLED instead."
        );
        await loadPurchases();
      } else {
        notify.error(`❌ Failed: ${error.message || "Please try again"}`);
      }
    }
  }

  function handleCancel() {
    setActiveTab(0);
    setEditingPurchase(null);
  }

  // =========================
  // EXTRA COLUMNS TOGGLE
  // =========================
  function toggleExtraColumns() {
    setShowExtraColumns(!showExtraColumns);
  }

  // =========================
  // RENDER CONFIG
  // =========================
  const tabs = [
    { id: 0, label: "All Purchases", icon: Package },
    { id: 1, label: "Purchase Definition", icon: FileEdit },
  ];

const tableActions = [
  {
    icon: <Edit size={14} strokeWidth={2} />,
    onClick: (row) => {
      if (row.status?.toLowerCase() === "cancelled" || row.status?.toLowerCase() === "received") {
        notify.warning(`Cannot edit a ${row.status} purchase.`);
        return;
      }
      handleEditPurchase(row);
    },
    title: "Edit Purchase",
    className: "btn-outline",
  },
  {
    // ✅ NEW: Cancel button — only for pending/approved
    icon: <X size={14} strokeWidth={2} />,
    onClick: async (row) => {
      if (row.status?.toLowerCase() === "cancelled") {
        notify.info("Purchase is already cancelled.");
        return;
      }
      if (row.status?.toLowerCase() === "received") {
        notify.warning("Cannot cancel a received purchase. Delete the GRN first.");
        return;
      }
      if (!window.confirm(`Cancel Purchase "${row.purchaseNumber}"?\n\nThis will mark it as Cancelled but preserve history.`)) return;
      
      try {
        // Set status to Cancelled via UpdateStatus endpoint
        await updatePurchaseStatus(row.purchaseId, "Cancelled");
        notify.success("Purchase cancelled.");
        await loadPurchases();
      } catch (err) {
        notify.error(err.message || "Failed to cancel purchase.");
      }
    },
    title: "Cancel Purchase",
    className: "btn-warning",
  },
  {
    icon: <Trash2 size={14} strokeWidth={2} />,
    onClick: handleDeletePurchase,
    title: "Delete Purchase",
    className: "btn-danger",
  },
];

  const searchFields = getPurchaseSearchFields(suppliers);

  return (
    <div className="purchase-definition">
      <PageTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onAddClick={handleAddPurchase}
        addButtonLabel="Add Purchase"
        addButtonIcon={Plus}
        flushTop={true}
      >
        {/* Tab 0: All Purchases */}
        <div>
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
            emptyMessage="No purchases found"
          />

          <span className="results-count">
            Showing {filteredData.length} of {purchases.length} purchases
            {activeFilterCount > 0 && (
              <span className="filter-info">
                {" "}
                (Filtered by {activeFilterCount} criteria)
              </span>
            )}
          </span>
        </div>

        {/* Tab 1: Purchase Definition (Form) */}
        <div>
          <PurchaseForm
            purchase={editingPurchase}
            onClose={handleCancel}
            onSave={handleSave}
            suppliers={suppliers}
            products={products}
          />
        </div>
      </PageTabs>
    </div>
  );
}

export default PurchaseDefinition;