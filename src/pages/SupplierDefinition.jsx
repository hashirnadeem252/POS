// pages/Suppliers/SupplierDefinition.jsx
import { useEffect, useState, useMemo } from "react";
import {
  List,
  FileEdit,
  Plus,
  Edit,
  Trash2,
  DollarSign,
  UploadCloud,
} from "lucide-react";
import DataTable from "../components/common/DataTable.jsx";
import PageTabs from "../components/common/PageTabs.jsx";
import SearchBar from "../components/common/SearchBar.jsx";
import SearchToolbar from "../components/common/SearchToolbar.jsx";
import useSearch from "../hooks/useSearch.js";
import { useExport, exportConfigs } from "../hooks/useExport.js";
import SupplierForm from "../components/suppliers/SupplierForm.jsx";
import SpreadsheetImportModal from "../components/common/SpreadsheetImportModal.jsx";
import PaySupplierModal from "../components/suppliers/PaySupplierModal.jsx"; // ✅ Added
import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from "../services/SupplierDefinition/supplierService.js";
import {
  supplierBaseColumns,
  supplierExtraColumns,
} from "../models/supplierColumns.jsx";
import { getSupplierSearchFields } from "../models/supplierSearchFields.js";
import { supplierImportFields } from "../utils/importTemplates.js";
import { importRowsIndividually } from "../utils/spreadsheetImport.js";
import { notify } from "../utils/notify"; 
import "../assets/styles/suppliers/SupplierDefinition.css";
import { getSupplierBalances } from "../services/SupplierDefinition/supplierService.js";

function SupplierDefinition() {
  // =========================
  // STATE
  // =========================
  const [activeTab, setActiveTab] = useState(0);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [showExtraColumns, setShowExtraColumns] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  
  // ✅ NEW STATES for Payment Modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedSupplierForPayment, setSelectedSupplierForPayment] = useState(null);

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
    data: suppliers,
    initialFilters: {
      code: "",
      name: "",
      contactPerson: "",
    },
    searchFields: [
      { name: "code", getValue: (item) => item.code },
      { name: "name", getValue: (item) => item.name },
      { name: "contactPerson", getValue: (item) => item.contactPerson },
    ],
  });

  // =========================
  // EXPORT HOOK
  // =========================
  const { handlePrint, handleExportCSV } = useExport({
    config: exportConfigs.suppliers,
  });

  // =========================
  // COMPUTED COLUMNS
  // =========================
  const columns = useMemo(() => {
    const base = [...supplierBaseColumns];
    if (showExtraColumns) {
      return [...base, ...supplierExtraColumns];
    }
    return base;
  }, [showExtraColumns]);

  // =========================
  // LOAD DATA
  // =========================
  useEffect(() => {
    loadSuppliers();
  }, []);

  async function loadSuppliers() {
    try {
      // ✅ 1. Fetch basic info AND financial balances
      const [suppliersData, balancesData] = await Promise.all([
        getSuppliers(),
        getSupplierBalances()
      ]);
      
      // ✅ 2. Create a fast lookup dictionary
      const balanceDict = {};
      (balancesData || []).forEach(b => {
        balanceDict[b.supplierId] = b.currentBalance;
      });

      // ✅ 3. Merge the balance into the supplier object
      const mergedSuppliers = (suppliersData || []).map(sup => ({
        ...sup,
        currentBalance: balanceDict[sup.supplierId] || 0
      }));

      setSuppliers(mergedSuppliers);
    } catch (error) {
      console.error("Error loading suppliers:", error);
      setSuppliers([]);
    }
  }

  async function importSupplierRows(rows) {
    return importRowsIndividually(rows, createSupplier, (record) => ({
      code: record.code,
      name: record.name,
      contactPerson: record.contactPerson || null,
      phone: record.phone || null,
      email: record.email || null,
      address: record.address || null,
      city: record.city || null,
      taxNumber: record.taxNumber || null,
      openingBalance: 0,
    }));
  }

  // =========================
  // HANDLERS
  // =========================
  function handleAddSupplier() {
    setEditingSupplier(null);
    setActiveTab(1);
  }

  function handleEditSupplier(supplier) {
    setEditingSupplier(supplier);
    setActiveTab(1);
  }

  function handleRowDoubleClick(supplier) {
    handleEditSupplier(supplier);
  }

  async function handleSave(formData) {
    try {
      if (editingSupplier) {
        await updateSupplier(editingSupplier.supplierId, formData);
        notify.success("✅ Supplier updated successfully");
      } else {
        await createSupplier(formData);
        notify.success("✅ Supplier added successfully");
      }
      
      // ✅ PROFESSIONAL FIX: Re-fetch the clean data from the database
      await loadSuppliers(); 
      
      // Go back to the list view
      setActiveTab(0);
      setEditingSupplier(null);
    } catch (error) {
      console.error("Error saving supplier:", error);
      notify.error("Failed to save supplier. Please try again.");
    }
  }

  // =========================
  // DELETE SUPPLIER
  // =========================
  async function handleDeleteSupplier(supplier) {
    if (!supplier) {
      notify.info("Supplier not found.");
      return;
    }

    const supplierName = supplier.name || "Unnamed Supplier";
    const supplierCode = supplier.code || "N/A";
    const supplierId = supplier.supplierId;
    const isActive = supplier.isActive === true || supplier.isActive === 1;

    const message = isActive
      ? `⚠️ Delete "${supplierName}" (${supplierCode})?\n\n` +
        `• If used in transactions → Marked as INACTIVE\n` +
        `• If not used → Permanently DELETED`
      : `"${supplierName}" (${supplierCode}) is already INACTIVE.\n\n` +
        `Permanently delete? ⚠️ Cannot be undone.`;

    if (!window.confirm(message)) return;

    try {
      await deleteSupplier(supplierId);
      setSuppliers((current) =>
        current.filter((s) => s.supplierId !== supplierId)
      );
      notify.success("✅ Supplier processed successfully!");
    } catch (error) {
      console.error("Delete error:", error);

      if (
        error.message?.includes("REFERENCE") ||
        error.message?.includes("foreign")
      ) {
        notify.info("Supplier is in use and has been marked as INACTIVE.");
        await loadSuppliers();
      } else {
        notify.error(`❌ Failed: ${error.message || "Please try again"}`);
      }
    }
  }

  function handleCancel() {
    setActiveTab(0);
    setEditingSupplier(null);
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
    { id: 0, label: "All Suppliers", icon: List },
    { id: 1, label: "Supplier Definition", icon: FileEdit },
  ];

  const tableActions = [
    {
      icon: <Edit size={14} strokeWidth={2} />,
      onClick: handleEditSupplier,
      title: "Edit Supplier",
      className: "btn-outline",
    },
    {
      icon: <DollarSign size={14} strokeWidth={2} />, 
      onClick: (supplier) => {
        // ✅ Opens the modal
        setSelectedSupplierForPayment(supplier);
        setShowPaymentModal(true);
      },
      title: "Pay Supplier",
      className: "btn-success",
    },
    {
      icon: <Trash2 size={14} strokeWidth={2} />,
      onClick: handleDeleteSupplier,
      title: "Delete Supplier",
      className: "btn-danger",
    },
  ];
  
  const searchFields = getSupplierSearchFields();

  return (
    <div className="supplier-definition">
      <PageTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onAddClick={handleAddSupplier}
        addButtonLabel="Add Supplier"
        addButtonIcon={Plus}
        flushTop={true}
        extraActions={
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => setShowImportModal(true)}
          >
            <UploadCloud size={16} /> Import
          </button>
        }
      >
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
            emptyMessage="No suppliers found"
          />

          <span className="results-count">
            Showing {filteredData.length} of {suppliers.length} suppliers
            {activeFilterCount > 0 && (
              <span className="filter-info">
                {" "}
                (Filtered by {activeFilterCount} criteria)
              </span>
            )}
          </span>
        </div>

        <div>
          <SupplierForm
            supplier={editingSupplier}
            onClose={handleCancel}
            onSave={handleSave}
          />
        </div>
      </PageTabs>

      {/* ✅ NEW: Pay Supplier Modal */}
      <PaySupplierModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedSupplierForPayment(null);
        }}
        supplier={selectedSupplierForPayment}
        onSuccess={loadSuppliers}
      />
      <SpreadsheetImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={importSupplierRows}
        onImportSuccess={loadSuppliers}
        title="suppliers"
        templateName="supplier_import_template.csv"
        fields={supplierImportFields}
        existingRecords={suppliers}
      />
    </div>
  );
}

export default SupplierDefinition;