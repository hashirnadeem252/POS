  // pages/Customers/CustomerDefinition.jsx
  import { useEffect, useState, useMemo } from "react";
  import {
    Users,
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
  import CustomerForm from "../components/customers/CustomerForm.jsx";
  import {
    getCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
  } from "../services/CustomerDefinition/customerService.js";
  import { notify } from "../utils/notify"; 
  import {
    customerBaseColumns,
    customerExtraColumns,
  } from "../models/customerColumns.jsx";
  import { getCustomerSearchFields } from "../models/customerSearchFields.js";
  import "../assets/styles/customers/CustomerDefinition.css";

  function CustomerDefinition() {
    // =========================
    // STATE
    // =========================
    const [activeTab, setActiveTab] = useState(0);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [showExtraColumns, setShowExtraColumns] = useState(false);
    const [customers, setCustomers] = useState([]);

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
      data: customers,
      initialFilters: {
        code: "",
        name: "",
        phone: "",
        email: "",
        city: "",
      },
      searchFields: [
        { name: "code", getValue: (item) => item.code },
        { name: "name", getValue: (item) => item.name },
        { name: "phone", getValue: (item) => item.phone },
        { name: "email", getValue: (item) => item.email },
        { name: "city", getValue: (item) => item.city },
      ],
    });

    // =========================
    // EXPORT HOOK
    // =========================
    const { handlePrint, handleExportCSV } = useExport({
      config: exportConfigs.customers,
    });

    // =========================
    // COMPUTED COLUMNS
    // =========================
    const columns = useMemo(() => {
      const base = [...customerBaseColumns];
      if (showExtraColumns) {
        return [...base, ...customerExtraColumns];
      }
      return base;
    }, [showExtraColumns]);

    // =========================
    // LOAD DATA
    // =========================
    useEffect(() => {
      loadCustomers();
    }, []);

    async function loadCustomers() {
      try {
        const data = await getCustomers();
        setCustomers(data);
      } catch (error) {
        console.error("Error loading customers:", error);
      }
    }

    // =========================
    // HANDLERS
    // =========================
    function handleAddCustomer() {
      setEditingCustomer(null);
      setActiveTab(1);
    }

    function handleEditCustomer(customer) {
      setEditingCustomer(customer);
      setActiveTab(1);
    }

    function handleRowDoubleClick(customer) {
      handleEditCustomer(customer);
    }

   async function handleSave(formData) {
    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer.customerId, formData);
        notify.success("✅ Customer updated successfully");
      } else {
        await createCustomer(formData);
        notify.success("✅ Customer added successfully");
      }
      
      // ✅ PROFESSIONAL FIX: Re-fetch to ensure clean data
      await loadCustomers(); 

      setActiveTab(0);
      setEditingCustomer(null);
    } catch (error) {
      console.error("Error saving customer:", error);
      notify.error("Failed to save customer. Please try again.");
    }
  }

    // =========================
    // DELETE CUSTOMER
    // =========================
    async function handleDeleteCustomer(customer) {
      if (!customer) {
        notify.warning("Customer not found.");
        return;
      }

      const customerName = customer.name || "Unnamed Customer";
      const customerCode = customer.code || "N/A";
      const customerId = customer.customerId;
      const isActive = customer.isActive === true || customer.isActive === 1;

      const message = isActive
        ? `⚠️ Delete "${customerName}" (${customerCode})?\n\n` +
          `• If used in transactions → Marked as INACTIVE\n` +
          `• If not used → Permanently DELETED`
        : `"${customerName}" (${customerCode}) is already INACTIVE.\n\n` +
          `Permanently delete? ⚠️ Cannot be undone.`;

      if (!window.confirm(message)) return;

      try {
        await deleteCustomer(customerId);
        setCustomers((current) =>
          current.filter((c) => c.customerId !== customerId)
        );
        notify.success("✅ Customer processed successfully!");
      } catch (error) {
        console.error("Delete error:", error);

        if (
          error.message?.includes("REFERENCE") ||
          error.message?.includes("foreign")
        ) {
          notify.warning("Customer is in use and has been marked as INACTIVE.");
          await loadCustomers();
        } else {
          notify.error(`❌ Failed: ${error.message || "Please try again"}`);
        }
      }
    }

    function handleCancel() {
      setActiveTab(0);
      setEditingCustomer(null);
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
      { id: 0, label: "All Customers", icon: Users },
      { id: 1, label: "Customer Definition", icon: FileEdit },
    ];

    const tableActions = [
      {
        icon: <Edit size={14} strokeWidth={2} />,
        onClick: handleEditCustomer,
        title: "Edit Customer",
        className: "btn-outline",
      },
      {
        icon: <Trash2 size={14} strokeWidth={2} />,
        onClick: handleDeleteCustomer,
        title: "Delete Customer",
        className: "btn-danger",
      },
    ];

    const searchFields = getCustomerSearchFields();

    return (
      <div className="customer-definition">
        <PageTabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onAddClick={handleAddCustomer}
          addButtonLabel="Add Customer"
          addButtonIcon={Plus}
          flushTop={true}
        >
          {/* Tab 0: All Customers */}
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
              emptyMessage="No customers found"
            />

            <span className="results-count">
              Showing {filteredData.length} of {customers.length} customers
              {activeFilterCount > 0 && (
                <span className="filter-info">
                  {" "}
                  (Filtered by {activeFilterCount} criteria)
                </span>
              )}
            </span>
          </div>

          {/* Tab 1: Customer Definition (Form) */}
          <div>
            <CustomerForm
              customer={editingCustomer}
              onClose={handleCancel}
              onSave={handleSave}
            />
          </div>
        </PageTabs>
      </div>
    );
  }

  export default CustomerDefinition; 