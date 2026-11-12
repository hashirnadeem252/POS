// pages/grn/GRNDefinition.jsx
import { useEffect, useState, useMemo } from "react";
import {
  Package,
  FileEdit,
  Plus,
  Edit,
  Trash2,
} from "lucide-react";
import DataTable from "../components/common/DataTable.jsx";
import PageTabs from "../components/common/PageTabs.jsx";
import SearchBar from "../components/common/SearchBar.jsx";
import SearchToolbar from "../components/common/SearchToolbar.jsx";
import useSearch from "../hooks/useSearch.js";
import { useExport, exportConfigs } from "../hooks/useExport.js";
import GRNForm from "../components/grn/GRNForm.jsx";
import {
  getGRNs,
  createGRN,
  updateGRN,
  deleteGRN,
} from "../services/GRNDefinition/grnService.js";
import { getSuppliers } from "../services/SupplierDefinition/supplierService.js";
import { getPurchases } from "../services/PurchaseDefinition/purchaseService.js";
import { getProducts } from "../services/ProductDefinition/productService.js";
import {
  grnBaseColumns,
  grnExtraColumns,
} from "../models/grnColumns.jsx";

import { getGRNSearchFields } from "../models/grnSearchFields.js";
import { notify } from "../utils/notify"; 
import "../assets/styles/grn/GRNDefinition.css";

function GRNDefinition() {
  // =========================
  // STATE
  // =========================
  const [activeTab, setActiveTab] = useState(0);
  const [editingGRN, setEditingGRN] = useState(null);
  const [showExtraColumns, setShowExtraColumns] = useState(false);

  const [grns, setGRNs] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [purchases, setPurchases] = useState([]);
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
    data: grns,
    initialFilters: {
      grnNumber: "",
      purchaseId: "",
      supplierId: "",
    },
    searchFields: [
      { name: "grnNumber", getValue: (item) => item.grnNumber },
      { name: "purchaseId", getValue: (item) => item.purchaseId },
      { name: "supplierId", getValue: (item) => item.supplierId },
    ],
  });

  // =========================
  // EXPORT HOOK
  // =========================
  const { handlePrint, handleExportCSV } = useExport({
    config: exportConfigs.grns,
  });

  // =========================
  // COMPUTED COLUMNS
  // =========================
  const columns = useMemo(() => {
    const base = [...grnBaseColumns];
    if (showExtraColumns) {
      return [...base, ...grnExtraColumns];
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
    try {
      const [grnsData, suppliersData, purchasesData, productsData] =
        await Promise.all([
          getGRNs(),
          getSuppliers(),
          getPurchases(),
          getProducts(),
        ]);
      setGRNs(grnsData || []);
      setSuppliers(suppliersData || []);
      setPurchases(purchasesData || []);
      setProducts(productsData || []);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  }

  // =========================
  // HANDLERS
  // =========================
  function handleAddGRN() {
    setEditingGRN(null);
    setActiveTab(1);
  }

  function handleEditGRN(grn) {
    setEditingGRN(grn);
    setActiveTab(1);
  }

  function handleRowDoubleClick(grn) {
    handleEditGRN(grn);
  }

  async function handleSave(formData) {
    try {
      if (editingGRN) {
        await updateGRN(editingGRN.grnId, formData);
        notify.success("✅ GRN updated successfully");
      } else {
        await createGRN(formData);
        notify.success("✅ GRN created successfully");
      }

      // ✅ PROFESSIONAL FIX: Re-fetch all data (GRNs, stock, etc.)
      await loadAllData();

      setActiveTab(0);
      setEditingGRN(null);
    } catch (error) {
      console.error("Error saving GRN:", error);
      notify.error("Failed to save GRN. Please try again.");
    }
  }

  // =========================
  // DELETE GRN
  // =========================
  async function handleDeleteGRN(grn) {
    if (!grn) {
      notify.warning("GRN not found.");
      return;
    }

    const grnNumber = grn.grnNumber || "Unnamed GRN";
    const grnId = grn.grnId;

    const confirmed = window.confirm(
      `⚠️ Delete GRN\n\n` +
        `GRN: ${grnNumber}\n\n` +
        `This action will permanently delete this GRN.\n` +
        `Do you want to proceed?`
    );

    if (!confirmed) return;

    try {
      await deleteGRN(grnId);
      setGRNs((current) => current.filter((g) => g.grnId !== grnId));
      notify.success("✅ GRN deleted successfully!");
    } catch (error) {
      console.error("Error deleting GRN:", error);
      notify.error("❌ Failed to delete GRN. Please try again.");
    }
  }

  function handleCancel() {
    setActiveTab(0);
    setEditingGRN(null);
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
    { id: 0, label: "All GRNs", icon: Package },
    { id: 1, label: "GRN Definition", icon: FileEdit },
  ];

  const tableActions = [
    {
      icon: <Edit size={14} strokeWidth={2} />,
      onClick: handleEditGRN,
      title: "Edit GRN",
      className: "btn-outline",
    },
    {
      icon: <Trash2 size={14} strokeWidth={2} />,
      onClick: (row) => handleDeleteGRN(row),
      title: "Delete GRN",
      className: "btn-danger",
    },
  ];

  const searchFields = getGRNSearchFields();

  return (
    <div className="grn-definition">
      <PageTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onAddClick={handleAddGRN}
        addButtonLabel="Add GRN"
        addButtonIcon={Plus}
        flushTop={true}
      >
        {/* Tab 0: All GRNs */}
        <div>
          <SearchToolbar
            showSearch={showSearch}
            onToggleSearch={toggleSearch}
            activeFilterCount={activeFilterCount}
            showExtraColumns={showExtraColumns}
            onToggleExtraColumns={toggleExtraColumns}
            extraColumnsCount={1}
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
            emptyMessage="No GRNs found"
          />

          <span className="results-count">
            Showing {filteredData.length} of {grns.length} GRNs
            {activeFilterCount > 0 && (
              <span className="filter-info">
                {" "}
                (Filtered by {activeFilterCount} criteria)
              </span>
            )}
          </span>
        </div>

        {/* Tab 1: GRN Definition (Form) */}
        <div>
          <GRNForm
            grn={editingGRN}
            onClose={handleCancel}
            onSave={handleSave}
            suppliers={suppliers}
            purchases={purchases}
            products={products}
          />
        </div>
      </PageTabs>
    </div>
  );
}

export default GRNDefinition;