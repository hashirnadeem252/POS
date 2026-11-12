// pages/SalesAndReturn.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { notify } from "../utils/notify";
import { getSales } from "../services/SaleDefinition/saleService";
import { usePosMasterData } from "../hooks/pos/usePosMasterData";
import { usePosCart } from "../hooks/pos/usePosCart";
import { usePosSaleLoader } from "../hooks/pos/usePosSaleLoader";
import { usePosTransaction } from "../hooks/pos/usePosTransaction";

import POSHeader from "../components/sales/POSHeader";
import POSReturnSearch from "../components/sales/POSReturnSearch";
import POSMasterTab from "../components/sales/POSMasterTab";
import POSItemsTab from "../components/sales/POSItemsTab";
import POSCart from "../components/sales/POSCart";
import POSBottomActions from "../components/sales/POSBottomActions";
import POSModals from "../components/sales/POSModals";
import LowStockAlert from "../components/common/LowStockAlert";
import LoadingSpinner from "../components/common/LoadingSpinner";
import SalesReturnSearch from "../components/sales/SalesReturnSearch";
import SalesSearch from "../components/sales/SalesSearch";
import ConfirmDialog from "../components/common/ConfirmDialog";
import HeldSalesModal from "../components/sales/HeldSalesModal";
import QuickAddModal from "../components/sales/QuickAddModal";

import "../assets/styles/sales/SalesAndReturn.css";

function SalesAndReturn() {
  const navigate = useNavigate();

  // ═══════════════════════════════════════════════
  // MASTER DATA
  // ═══════════════════════════════════════════════
  const {
    loading,
    customers,
    salesPersons,
    products,
    localProducts,
    filteredProducts,
    setFilteredProducts,
    refreshProducts,
  } = usePosMasterData();

  // ═══════════════════════════════════════════════
  // UI STATE
  // ═══════════════════════════════════════════════
  const [mode, setMode] = useState("sale");
  const [isEditing, setIsEditing] = useState(false);
  const [foundSale, setFoundSale] = useState(null);
  const [returnLoaded, setReturnLoaded] = useState(false);
  const [isManualReturn, setIsManualReturn] = useState(false);

  const [editingReturnId, setEditingReturnId] = useState(null);

  const [returnInvoiceNumber, setReturnInvoiceNumber] = useState("");
  const [searchingSale, setSearchingSale] = useState(false);
  const [allSales, setAllSales] = useState([]);

  const [showProductModal, setShowProductModal] = useState(false);
 const [showPaymentModal, setShowPaymentModal] = useState(null);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showSalesPersonModal, setShowSalesPersonModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showSalesSearch, setShowSalesSearch] = useState(false);
  const [showReturnsSearch, setShowReturnsSearch] = useState(false);
  const [completedSale, setCompletedSale] = useState(null);
  const [showHeldModal, setShowHeldModal] = useState(false);

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedSalesPerson, setSelectedSalesPerson] = useState(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [salesPersonSearch, setSalesPersonSearch] = useState("");

  const [activeTab, setActiveTab] = useState("master");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [searchTerm, setSearchTerm] = useState("");
  const [quickAddType, setQuickAddType] = useState(null); // "customer" | "salesperson" | null

  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    type: null,
    payload: null,
  });

  const [saleData, setSaleData] = useState({
    saleId: null,
    invoiceNumber: "",
    customerId: "",
    salesPersonId: "",
    saleDate: new Date().toISOString(),
    subTotal: 0,
    discount: 0,
    tax: 0,
    total: 0,
    paidAmount: 0,
    remainingAmount: 0,
    paymentMethod: "Cash",
    status: "Completed",
    comments: "",
    details: [],
  });

  // ═══════════════════════════════════════════════
  // CART
  // ═══════════════════════════════════════════════
  const {
    cartItems,
    setCartItems,
    selectedProductIds,
    setSelectedProductIds,
    calculateTotals,
    addProductToCart,
    removeProductFromCart,
    updateReturnQuantity,
    updateExchangeQuantity,
    updateSaleQuantity,
    updateDiscount,
    toggleVoid,
    removeItem,
    toggleItemType,
    resetCart,
  } = usePosCart({
    mode,
    foundSale,
    isManualReturn,
    products,
    setSaleData,
  });

  // ═══════════════════════════════════════════════
  // RESET ALL
  // ═══════════════════════════════════════════════
  const resetAll = () => {
    resetCart();
    setSearchTerm("");
    setFilteredProducts(localProducts);
    setSelectedCustomer(null);
    setSelectedSalesPerson(null);
    setCustomerSearch("");
    setSalesPersonSearch("");
    setCurrentPage(1);
    setFoundSale(null);
    setReturnInvoiceNumber("");
    setIsEditing(false);
    setIsManualReturn(false);
    setReturnLoaded(false);
    setMode("sale");
    setEditingReturnId(null);

    setSaleData({
      saleId: null,
      invoiceNumber: `INV-${Date.now()}`,
      customerId: "",
      salesPersonId: "",
      saleDate: new Date().toISOString(),
      subTotal: 0,
      discount: 0,
      tax: 0,
      total: 0,
      paidAmount: 0,
      remainingAmount: 0,
      paymentMethod: "Cash",
      status: "Completed",
      comments: "",
      details: [],
    });

    sessionStorage.removeItem("editSaleData");
    sessionStorage.removeItem("returnSaleData");
    sessionStorage.removeItem("editReturnData");
  };

  // ═══════════════════════════════════════════════
  // SALE LOADER
  // ═══════════════════════════════════════════════
  const { loadSaleForEdit, loadSaleForReturn, loadReturnForEdit } =
    usePosSaleLoader({
      customers,
      salesPersons,
      products,
      setIsEditing,
      setMode,
      setFoundSale,
      setReturnLoaded,
      setIsManualReturn,
      setSaleData,
      setSelectedCustomer,
      setSelectedSalesPerson,
      setCartItems,
      calculateTotals,
      setEditingReturnId,
    });

  // ═══════════════════════════════════════════════
  // TRANSACTION
  // ═══════════════════════════════════════════════
  const {
    processTransaction,
    processSale,
    saveSale,
    processReturn,
    handleHold,
    confirmHold,
  } = usePosTransaction({
    mode,
    isEditing,
    foundSale,
    saleData,
    setSaleData,
    cartItems,
    selectedCustomer,
    selectedSalesPerson,
    resetAll,
    setCompletedSale,
    setShowInvoiceModal,
    setConfirmState,
    editingReturnId,
    products, 
  });

  // ═══════════════════════════════════════════════
  // INITIAL SALE NUMBER
  // ═══════════════════════════════════════════════
  useEffect(() => {
    setSaleData((prev) => ({
      ...prev,
      invoiceNumber: prev.invoiceNumber || `INV-${Date.now()}`,
    }));
  }, []);

  // ═══════════════════════════════════════════════
  // LOAD ALL SALES
  // ═══════════════════════════════════════════════
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const sales = await getSales();
        if (!cancelled && sales) setAllSales(sales);
      } catch (error) {
        console.error("Error loading sales:", error);
        if (!cancelled) setAllSales([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ═══════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════
  const handleConfirmAction = () => {
    const { type } = confirmState;
    if (type === "exit") {
      setConfirmState({ isOpen: false, type: null, payload: null });
      navigate("/");
    } else if (type === "processSale") {
      setConfirmState({ isOpen: false, type: null, payload: null });
      saveSale();
    } else if (type === "hold") {
      confirmHold();
    }
  };

  const handleInvoiceClose = () => {
    setShowInvoiceModal(false);
    setCompletedSale(null);
    resetAll();
  };

  const exitPOS = () => {
    if (cartItems.length > 0) {
      setConfirmState({ isOpen: true, type: "exit" });
      return;
    }
    navigate("/");
  };

  const selectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setSaleData((prev) => ({ ...prev, customerId: customer.customerId }));
    setCustomerSearch("");
  };

  const selectSalesPerson = (person) => {
    setSelectedSalesPerson(person);
    setSaleData((prev) => ({ ...prev, salesPersonId: person.salesPersonId }));
    setSalesPersonSearch("");
  };

  const handleMasterChange = (e) => {
    const { name, value } = e.target;
    setSaleData((prev) => ({ ...prev, [name]: value }));
  };

  const searchSaleForReturn = () => {
    if (!returnInvoiceNumber.trim()) {
      notify.warning("Please enter a sale invoice number");
      return;
    }
    if (allSales.length === 0) {
      notify.warning("No sales data loaded");
      return;
    }

    setSearchingSale(true);

    setTimeout(() => {
      const term = returnInvoiceNumber.trim().toLowerCase();
      const found =
        allSales.find((s) => s.invoiceNumber?.toLowerCase() === term) ||
        allSales.find((s) => s.invoiceNumber?.toLowerCase().includes(term));

      if (found) {
        setFoundSale(found);
        setReturnLoaded(true);
        setIsManualReturn(false);
        setReturnInvoiceNumber("");
        loadSaleForReturn(found);
        notify.success(`Sale ${found.invoiceNumber} loaded for return`);
      } else {
        notify.warning(`Sale "${returnInvoiceNumber}" not found`);
      }
      setSearchingSale(false);
    }, 300);
  };

  const startManualReturn = () => {
    setMode("return");
    setFoundSale(null);
    setReturnLoaded(true);
    setIsManualReturn(true);
    setEditingReturnId(null);
    setCartItems([]);
    setSaleData((prev) => ({
      ...prev,
      invoiceNumber: `RET-${Date.now()}`,
      saleId: null,
      subTotal: 0,
      discount: 0,
      tax: 0,
      total: 0,
      comments: "Manual return without invoice",
    }));
    notify.info("Manual return mode enabled");
  };

  // ═══════════════════════════════════════════════
  // PAGINATION & FILTERS
  // ═══════════════════════════════════════════════
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentItems = filteredProducts.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const filteredCustomers = customers.filter(
    (c) =>
      c.name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.code?.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.phone?.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const filteredSalesPersons = salesPersons.filter(
    (p) =>
      p.name?.toLowerCase().includes(salesPersonSearch.toLowerCase()) ||
      p.code?.toLowerCase().includes(salesPersonSearch.toLowerCase())
  );

  // ═══════════════════════════════════════════════
  // COUNTS
  // ═══════════════════════════════════════════════
  const activeCount = cartItems.filter((i) => !i.isVoid).length;
  const voidedCount = cartItems.filter((i) => i.isVoid).length;
  const returnCount = cartItems.filter(
    (i) => !i.isVoid && i.itemType === "return"
  ).length;
  const exchangeCount = cartItems.filter(
    (i) => !i.isVoid && i.itemType === "exchange"
  ).length;

  // ═══════════════════════════════════════════════
  // LOOKUP COLUMNS
  // ═══════════════════════════════════════════════
  const productLookupColumns = [
    { key: "code", label: "Code" },
    { key: "name", label: "Name" },
    {
      key: "retailPrice",
      label: "Price",
      className: "numeric",
      render: (item) => `PKR ${item.retailPrice || 0}`,
    },
    {
      key: "currentStock",
      label: "Stock",
      className: "numeric",
      render: (item) => {
        const stock = item.currentStock || 0;
        return (
          <span
            style={{
              color:
                stock <= 0 ? "#dc3545" : stock < 10 ? "#ffc107" : "#28a745",
              fontWeight: "bold",
            }}
          >
            {stock}
          </span>
        );
      },
    },
  ];

  const customerLookupColumns = [
    { key: "code", label: "Code" },
    { key: "name", label: "Name" },
    { key: "phone", label: "Phone" },
    { key: "email", label: "Email" },
  ];

  const salesPersonLookupColumns = [
    { key: "code", label: "Code" },
    { key: "name", label: "Name" },
    { key: "phone", label: "Phone" },
    { key: "email", label: "Email" },
  ];

  // ═══════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════
  if (loading) {
    return (
      <div className="pos-fullscreen">
        <LowStockAlert onRefresh={refreshProducts} />
        <LoadingSpinner fullPage message="Loading POS data..." size="large" />
      </div>
    );
  }

  return (
    <div className="pos-fullscreen">
      <LowStockAlert onRefresh={refreshProducts} />

      <POSHeader
        mode={mode}
        isEditing={isEditing}
        saleData={saleData}
        resetAll={resetAll}
        setMode={setMode}
        navigate={navigate}
        refreshProducts={refreshProducts}
        onSearchSales={() => setShowSalesSearch(true)}
        onViewReturns={() => setShowReturnsSearch(true)}
        exitPOS={exitPOS}
      />

      {mode === "return" && !returnLoaded && (
        <POSReturnSearch
          returnInvoiceNumber={returnInvoiceNumber}
          setReturnInvoiceNumber={setReturnInvoiceNumber}
          searchSaleForReturn={searchSaleForReturn}
          searchingSale={searchingSale}
          startManualReturn={startManualReturn}
        />
      )}

      {(mode === "sale" || (mode === "return" && returnLoaded)) && (
        <div className="pos-three-column">
          <div className="pos-left">
            <div className="left-tabs">
              <button
                className={`tab-btn ${
                  activeTab === "master" ? "active" : ""
                }`}
                onClick={() => setActiveTab("master")}
              >
                👤 Master
              </button>
              <button
                className={`tab-btn ${activeTab === "items" ? "active" : ""}`}
                onClick={() => setActiveTab("items")}
              >
                📦 Items
              </button>
            </div>

            {activeTab === "master" && (
              <POSMasterTab
                salesPersonSearch={salesPersonSearch}
                setSalesPersonSearch={setSalesPersonSearch}
                filteredSalesPersons={filteredSalesPersons}
                selectSalesPerson={selectSalesPerson}
                selectedSalesPerson={selectedSalesPerson}
                setSelectedSalesPerson={setSelectedSalesPerson}
                setSaleData={setSaleData}
                customerSearch={customerSearch}
                setCustomerSearch={setCustomerSearch}
                filteredCustomers={filteredCustomers}
                selectCustomer={selectCustomer}
                selectedCustomer={selectedCustomer}
                setSelectedCustomer={setSelectedCustomer}
                saleData={saleData}
                handleMasterChange={handleMasterChange}
                foundSale={foundSale}
                setShowSalesPersonModal={setShowSalesPersonModal}
                setShowCustomerModal={setShowCustomerModal}
                  onQuickAddCustomer={() => setQuickAddType("customer")}
  onQuickAddSalesPerson={() => setQuickAddType("salesperson")}
                mode={mode}
              />
            )}

            {activeTab === "items" && (
              <POSItemsTab
                mode={mode}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                setCurrentPage={setCurrentPage}
                setFilteredProducts={setFilteredProducts}
                localProducts={localProducts}
                currentItems={currentItems}
                totalPages={totalPages}
                currentPage={currentPage}
                addProductToCart={addProductToCart}
                foundSale={foundSale}
                setShowProductModal={setShowProductModal}
              />
            )}
          </div>

          <POSCart
            mode={mode}
            cartItems={cartItems}
            activeCount={activeCount}
            voidedCount={voidedCount}
            returnCount={returnCount}
            exchangeCount={exchangeCount}
            updateReturnQuantity={updateReturnQuantity}
            updateExchangeQuantity={updateExchangeQuantity}
            updateSaleQuantity={updateSaleQuantity}
            updateDiscount={updateDiscount}
            toggleVoid={toggleVoid}
            removeItem={removeItem}
            toggleItemType={toggleItemType}
            saleData={saleData}
          />
        </div>
      )}

<POSBottomActions
  mode={mode}
  saleData={saleData}
  setSaleData={setSaleData}
  resetAll={resetAll}
  onOpenHeldSales={() => setShowHeldModal(true)}
  processTransaction={(method) => {
    // ✅ Route to the correct modal
    if (method === "Cash") setShowPaymentModal("Cash");
    else if (method === "Card/QR") setShowPaymentModal("Digital");
    else if (method === "Credit") setShowCreditModal(true);
    else processTransaction(method);
  }}
  processReturn={processReturn}
  handleHold={handleHold}
/>
      
      
      <POSModals
        showProductModal={showProductModal}
        setShowProductModal={setShowProductModal}
        showCustomerModal={showCustomerModal}
        setShowCustomerModal={setShowCustomerModal}
        showSalesPersonModal={showSalesPersonModal}
        setShowSalesPersonModal={setShowSalesPersonModal}
        showInvoiceModal={showInvoiceModal}
        handleInvoiceClose={handleInvoiceClose}
        completedSale={completedSale}
        productLookupColumns={productLookupColumns}
        customerLookupColumns={customerLookupColumns}
        salesPersonLookupColumns={salesPersonLookupColumns}
        localProducts={localProducts}
        cartItems={cartItems}
        mode={mode}
        foundSale={foundSale}
        addProductToCart={addProductToCart}
        removeProductFromCart={removeProductFromCart}
        customers={customers}
        selectedCustomer={selectedCustomer}
        selectCustomer={selectCustomer}
        salesPersons={salesPersons}
        selectedSalesPerson={selectedSalesPerson}
        selectSalesPerson={selectSalesPerson}
        refreshProducts={refreshProducts}
        onPrint={() => {}}
        
        // Payment & Credit Modals
        showPaymentModal={showPaymentModal}
        setShowPaymentModal={setShowPaymentModal}
        showCreditModal={showCreditModal}
        setShowCreditModal={setShowCreditModal}
        saleData={saleData}
        processTransaction={processTransaction}
      />

      {showSalesSearch && (
        <SalesSearch
          onClose={() => setShowSalesSearch(false)}
          onEditSale={(sale) => {
            loadSaleForEdit(sale);
            setShowSalesSearch(false);
          }}
          onReturnSale={(sale) => {
            loadSaleForReturn(sale);
            setShowSalesSearch(false);
          }}
        />
      )}

      {showReturnsSearch && (
        <SalesReturnSearch
          onClose={() => setShowReturnsSearch(false)}
          onEditReturn={(salesReturn) => {
            loadReturnForEdit(salesReturn);
            setShowReturnsSearch(false);
          }}
        />
      )}

      <ConfirmDialog
        isOpen={confirmState.isOpen}
        onClose={() =>
          setConfirmState({ isOpen: false, type: null, payload: null })
        }
        onConfirm={handleConfirmAction}
        title={
          confirmState.type === "exit"
            ? "Exit POS?"
            : confirmState.type === "processSale"
            ? "Complete Sale?"
            : "Hold Sale?"
        }
        message={
          confirmState.type === "exit"
            ? `You have ${cartItems.length} item(s) in the cart.\n\nExiting will clear the cart. Continue?`
            : confirmState.type === "processSale"
            ? `Total: PKR ${saleData.total.toFixed(
                2
              )}\n\nProceed with ${confirmState.payload}?`
            : `Hold this sale for later?\n\nItems: ${
                cartItems.filter((i) => !i.isVoid && i.itemType === "sale")
                  .length
              }\nTotal: PKR ${saleData.total.toFixed(2)}`
        }
        confirmText={
          confirmState.type === "exit"
            ? "Exit"
            : confirmState.type === "processSale"
            ? "Complete"
            : "Hold"
        }
        variant={
          confirmState.type === "exit"
            ? "danger"
            : confirmState.type === "processSale"
            ? "info"
            : "warning"
        }
      />
       <HeldSalesModal 
        isOpen={showHeldModal} 
        onClose={() => setShowHeldModal(false)} 
        onResumeSale={(sale) => {
          setShowHeldModal(false); // ✅ 1. Close the modal IMMEDIATELY
          setTimeout(() => {
            loadSaleForEdit(sale); // ✅ 2. Load the cart after the modal closes
          }, 10);
        }}
      />
      <QuickAddModal
  isOpen={!!quickAddType}
  onClose={() => setQuickAddType(null)}
  type={quickAddType}
  onSuccess={(newRecord) => {
    // Automatically select the newly added customer/salesperson
    if (quickAddType === "customer") selectCustomer(newRecord);
    else selectSalesPerson(newRecord);
  }}
/>
    </div>
  );
}

export default SalesAndReturn;