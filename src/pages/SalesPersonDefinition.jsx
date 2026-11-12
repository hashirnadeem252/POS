// pages/SalesPersons/SalesPersonDefinition.jsx

import { useEffect, useState, useMemo } from "react";
import {
  User,
  FileEdit,
  Plus,
  Edit,
  Trash2,
} from "lucide-react";
import { notify } from "../utils/notify"; 
import DataTable from "../components/common/DataTable.jsx";
import PageTabs from "../components/common/PageTabs.jsx";
import SearchBar from "../components/common/SearchBar.jsx";
import SearchToolbar from "../components/common/SearchToolbar.jsx";
import useSearch from "../hooks/useSearch.js";
import { useExport, exportConfigs } from "../hooks/useExport.js";
import SalesPersonForm from "../components/salespersons/SalesPersonForm.jsx";
import {
  getSalesPersons,
  createSalesPerson,
  updateSalesPerson,
  deleteSalesPerson,
  restoreSalesPerson,
  hardDeleteSalesPerson,
} from "../services/SalesPersonDefinition/salesPersonService.js";
import {
  salesPersonBaseColumns,
  salesPersonExtraColumns,
} from "../models/salesPersonColumns.jsx";
import { getSalesPersonSearchFields } from "../models/salesPersonSearchFields.js";
import "../assets/styles/salespersons/SalesPersonDefinition.css";

function SalesPersonDefinition() {
  // =========================
  // STATE
  // =========================
  const [activeTab, setActiveTab] = useState(0);
  const [editingSalesPerson, setEditingSalesPerson] = useState(null);
  const [showExtraColumns, setShowExtraColumns] = useState(false);
  const [salesPersons, setSalesPersons] = useState([]);

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
    data: salesPersons,
    initialFilters: {
      code: "",
      name: "",
      phone: "",
      email: "",
    },
    searchFields: [
      { name: "code", getValue: (item) => item.code },
      { name: "name", getValue: (item) => item.name },
      { name: "phone", getValue: (item) => item.phone },
      { name: "email", getValue: (item) => item.email },
    ],
  });

  // =========================
  // EXPORT HOOK
  // =========================
  const { handlePrint, handleExportCSV } = useExport({
    config: exportConfigs.salesPersons,
  });

  // =========================
  // COMPUTED COLUMNS
  // =========================
  const columns = useMemo(() => {
    const base = [...salesPersonBaseColumns];
    if (showExtraColumns) {
      return [...base, ...salesPersonExtraColumns];
    }
    return base;
  }, [showExtraColumns]);

  // =========================
  // LOAD DATA
  // =========================
  useEffect(() => {
    loadSalesPersons();
  }, []);

  async function loadSalesPersons() {
    try {
      const data = await getSalesPersons();
      setSalesPersons(data);
    } catch (error) {
      console.error("Error loading salespersons:", error);
    }
  }

  // =========================
  // HANDLERS
  // =========================
  function handleAddSalesPerson() {
    setEditingSalesPerson(null);
    setActiveTab(1);
  }

  function handleEditSalesPerson(salesPerson) {
    setEditingSalesPerson(salesPerson);
    setActiveTab(1);
  }

  function handleRowDoubleClick(salesPerson) {
    handleEditSalesPerson(salesPerson);
  }

  async function handleSave(formData) {
    try {
      if (editingSalesPerson) {
        await updateSalesPerson(
          editingSalesPerson.salesPersonId,
          formData
        );
        setSalesPersons((current) =>
          current.map((s) =>
            s.salesPersonId === editingSalesPerson.salesPersonId
              ? { ...s, ...formData }
              : s
          )
        );
      } else {
        const newSalesPerson = await createSalesPerson(formData);
        setSalesPersons((current) => [...current, newSalesPerson]);
      }
      setActiveTab(0);
      setEditingSalesPerson(null);
    } catch (error) {
      console.error("Error saving salesperson:", error);
      notify.error("Failed to save salesperson. Please try again.");
    }
  }

  // =========================
  // DELETE HANDLER (soft + hard delete)
  // =========================
  async function handleDelete(salesPerson) {
    if (!salesPerson) {
      notify.info("Sales person not found.");
      return;
    }

    const salesPersonName = salesPerson.name || "Unnamed Sales Person";
    const salesPersonId = salesPerson.salesPersonId;
    const isDeleted =
      salesPerson.isDeleted === true || salesPerson.isDeleted === 1;

    // If already deleted → Restore or Permanently Delete
    if (isDeleted) {
      const action = window.confirm(
        `"${salesPersonName}" is already DELETED.\n\n` +
          `Choose an action:\n` +
          `• Click "OK" to RESTORE this sales person\n` +
          `• Click "Cancel" to PERMANENTLY DELETE`
      );

      if (action) {
        // RESTORE
        try {
          await restoreSalesPerson(salesPersonId);
          await loadSalesPersons();
          notify.success("✅ Sales person restored successfully!");
          return;
        } catch (error) {
          console.error("Error restoring sales person:", error);
          notify.error("❌ Failed to restore sales person. Please try again.");
          return;
        }
      } else {
        // PERMANENT DELETE
        const confirmHardDelete = window.confirm(
          `⚠️ PERMANENTLY DELETE "${salesPersonName}"?\n\n` +
            `This action CANNOT be undone.\n` +
            `All associated data will be removed.\n\n` +
            `Are you sure?`
        );

        if (confirmHardDelete) {
          try {
            await hardDeleteSalesPerson(salesPersonId);
            await loadSalesPersons();
            notify.success("✅ Sales person permanently deleted!");
          } catch (error) {
            console.error(
              "Error permanently deleting sales person:",
              error
            );

            if (
              error.message?.includes("reference") ||
              error.message?.includes("foreign")
            ) {
              notify.error(
                "❌ Cannot permanently delete this sales person.\n\n" +
                  `Name: ${salesPersonName}\n\n` +
                  "This sales person is referenced in other records.\n" +
                  "It will remain soft-deleted."
              );
              await loadSalesPersons();
            } else {
              notify.error(`❌ Failed: ${error.message || "Please try again"}`);
            }
          }
        }
        return;
      }
    }

    // Soft delete confirmation
    const message =
      `⚠️ Delete Sales Person\n\n` +
      `Name: ${salesPersonName}\n` +
      `Status: ${salesPerson.isActive ? "Active" : "Inactive"}\n\n` +
      `This sales person will be:\n` +
      `• Marked as DELETED\n` +
      `• Hidden from active lists\n` +
      `• Can be restored later\n\n` +
      `Do you want to proceed?`;

    if (!window.confirm(message)) return;

    try {
      await deleteSalesPerson(salesPersonId);
      await loadSalesPersons();
      notify.success("✅ Sales person deleted successfully!");
    } catch (error) {
      console.error("Error deleting sales person:", error);

      if (
        error.message?.includes("reference") ||
        error.message?.includes("foreign")
      ) {
        notify.error(
          "❌ Cannot delete this sales person.\n\n" +
            `Name: ${salesPersonName}\n\n` +
            "This sales person is being used in other records.\n" +
            "It has been marked as INACTIVE instead."
        );
        await loadSalesPersons();
      } else {
        notify.error(`❌ Failed: ${error.message || "Please try again"}`);
      }
    }
  }

  function handleCancel() {
    setActiveTab(0);
    setEditingSalesPerson(null);
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
    { id: 0, label: "All Sales Persons", icon: User },
    { id: 1, label: "Sales Person Definition", icon: FileEdit },
  ];

  const tableActions = [
    {
      icon: <Edit size={14} strokeWidth={2} />,
      onClick: (row) => {
        // Prevent editing if deleted
        if (row.isDeleted) {
          notify.info("Cannot edit a deleted sales person. Restore it first.");
          return;
        }
        handleEditSalesPerson(row);
      },
      title: "Edit Sales Person",
      className: "btn-outline",
    },
    {
      icon: <Trash2 size={14} strokeWidth={2} />,
      onClick: handleDelete,
      title: "Delete Sales Person",
      className: "btn-danger",
    },
  ];

  const searchFields = getSalesPersonSearchFields();

  return (
    <div className="salesperson-definition">
      <PageTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onAddClick={handleAddSalesPerson}
        addButtonLabel="Add Sales Person"
        addButtonIcon={Plus}
        flushTop={true}
      >
        {/* Tab 0: All Sales Persons */}
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
            emptyMessage="No sales persons found"
          />

          <span className="results-count">
            Showing {filteredData.length} of {salesPersons.length} sales persons
            {activeFilterCount > 0 && (
              <span className="filter-info">
                {" "}
                (Filtered by {activeFilterCount} criteria)
              </span>
            )}
          </span>
        </div>

        {/* Tab 1: Sales Person Definition (Form) */}
        <div>
          <SalesPersonForm
            salesPerson={editingSalesPerson}
            onClose={handleCancel}
            onSave={handleSave}
          />
        </div>
      </PageTabs>
    </div>
  );
}

export default SalesPersonDefinition;