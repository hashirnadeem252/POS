// components/sales/POSModals.jsx
import React, { useState, useEffect } from "react";
import { Banknote, CreditCard, X, CheckCircle2, Clock, Smartphone, Building2 } from "lucide-react";
import ItemLookupModal from "../common/ItemLookupModal";
import EntityLookupModal from "../common/EntityLookupModal";
import InvoiceModal from "./InvoiceModal";

function POSModals({
  showProductModal,
  setShowProductModal,
  showCustomerModal,
  setShowCustomerModal,
  showSalesPersonModal,
  setShowSalesPersonModal,
  showInvoiceModal,
  handleInvoiceClose,
  completedSale,
  productLookupColumns,
  customerLookupColumns,
  salesPersonLookupColumns,
  localProducts,
  cartItems,
  mode,
  foundSale,
  addProductToCart,
  removeProductFromCart,
  customers,
  selectedCustomer,
  selectCustomer,
  salesPersons,
  selectedSalesPerson,
  selectSalesPerson,
  refreshProducts,
  onPrint,
  showPaymentModal,
  setShowPaymentModal,
  showCreditModal,
  setShowCreditModal,
  saleData,
  processTransaction,
}) {
  // ✅ ALL HOOKS MUST BE AT THE TOP
  const [cashReceived, setCashReceived] = useState("");
  const [digitalMethod, setDigitalMethod] = useState("");
  const [digitalRef, setDigitalRef] = useState("");

  // Reset inputs when modal opens
  useEffect(() => {
    if (showPaymentModal) {
      setCashReceived("");
      setDigitalMethod("");
      setDigitalRef("");
    }
  }, [showPaymentModal]);

  // ✅ EARLY RETURN MUST BE AFTER ALL HOOKS
  if (!showPaymentModal && !showProductModal && !showCustomerModal && !showSalesPersonModal && !showInvoiceModal && !showCreditModal) {
    return null;
  }

  const totalAmount = saleData?.total || 0;
  const cashNum = parseFloat(cashReceived) || 0;
  const changeDue = cashNum > totalAmount ? cashNum - totalAmount : 0;

  const handleQuickCash = (amount) => {
    setCashReceived(amount.toString());
  };

  const confirmPayment = () => {
    if (cashNum < totalAmount) {
      alert("Cash received is less than total amount!");
      return;
    }
    processTransaction("Cash", true); 
    setShowPaymentModal(false);
  };

  const confirmDigitalPayment = () => {
    if (!digitalMethod) {
      alert("Please select a payment method");
      return;
    }
    processTransaction(digitalMethod, true); 
    setShowPaymentModal(false);
  };

  return (
    <>
      {/* Product Lookup */}
      <ItemLookupModal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        onSelectItem={(product, selected) => {
          if (selected) {
            if (mode === "return") {
              const isInInvoice = foundSale?.details?.some(
                (d) => d.productId === product.productId
              );
              addProductToCart(product, isInInvoice ? true : false);
            } else {
              addProductToCart(product, false);
            }
          } else {
            if (removeProductFromCart) {
              removeProductFromCart(product.productId);
            }
          }
        }}
        items={localProducts}
        selectedItems={cartItems.filter((i) => !i.isVoid).map((i) => ({ productId: i.productId }))}
        title={mode === "return" ? "Select Items (Return/Exchange)" : "Select Products"}
        searchPlaceholder="Search by code, name, or barcode..."
        loading={false}
        emptyMessage="No products found"
        multiSelect={true}
        columns={productLookupColumns}
        onRefresh={refreshProducts}
      />

      {/* Customer Lookup */}
      <EntityLookupModal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        onSelect={selectCustomer}
        items={customers}
        selectedItem={selectedCustomer}
        idField="customerId"
        title="Select Customer"
        searchPlaceholder="Search by name, code, or phone..."
        emptyMessage="No customers found"
        columns={customerLookupColumns}
      />

      {/* Sales Person Lookup */}
      <EntityLookupModal
        isOpen={showSalesPersonModal}
        onClose={() => setShowSalesPersonModal(false)}
        onSelect={selectSalesPerson}
        items={salesPersons}
        selectedItem={selectedSalesPerson}
        idField="salesPersonId"
        title="Select Sales Person"
        searchPlaceholder="Search by name or code..."
        emptyMessage="No sales persons found"
        columns={salesPersonLookupColumns}
      />

      {/* Invoice Modal */}
      <InvoiceModal
        isOpen={showInvoiceModal}
        onClose={handleInvoiceClose}
        saleData={completedSale}
        onPrint={onPrint}
      />

      {/* ✅ CASH PAYMENT MODAL */}
      {showPaymentModal === "Cash" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000 }}>
          <div style={{ background: "#fff", borderRadius: "16px", width: "100%", maxWidth: "440px", padding: "24px", boxShadow: "0 24px 48px rgba(0,0,0,0.2)", position: "relative" }}>
            
            <button onClick={() => setShowPaymentModal(false)} style={{ position: "absolute", top: 16, right: 16, background: "#f1f5f9", border: "none", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <X size={18} />
            </button>

            <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 20px 0", display: "flex", alignItems: "center", gap: 8, color: "#12203A" }}>
              <Banknote color="#0D9488" /> Cash Payment
            </h2>

            <div style={{ background: "#F3F5F8", padding: "16px", borderRadius: "12px", textAlign: "center", marginBottom: "24px" }}>
              <div style={{ fontSize: "13px", color: "#6B7A8F", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Amount</div>
              <div style={{ fontSize: "36px", fontWeight: 800, color: "#12203A", marginTop: "4px" }}>
                Rs {totalAmount.toFixed(2)}
              </div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px", color: "#12203A" }}>Cash Received</label>
              <input
                type="number"
                autoFocus
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (cashNum >= totalAmount) confirmPayment();
                  }
                }}
                placeholder="Enter amount..."
                style={{ width: "100%", padding: "16px", fontSize: "24px", fontWeight: 700, textAlign: "center", borderRadius: "8px", border: "2px solid #0D9488", outline: "none", background: "#E6F7F5", color: "#0F766E" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "24px" }}>
              <button onClick={() => { setCashReceived(totalAmount.toString()); setTimeout(() => confirmPayment(), 100); }} style={{ padding: "12px", borderRadius: "8px", border: "1px solid #EAEDF2", background: "#fff", fontWeight: 600, cursor: "pointer" }}>Exact</button>
              <button onClick={() => handleQuickCash(500)} style={{ padding: "12px", borderRadius: "8px", border: "1px solid #EAEDF2", background: "#fff", fontWeight: 600, cursor: "pointer" }}>Rs 500</button>
              <button onClick={() => handleQuickCash(1000)} style={{ padding: "12px", borderRadius: "8px", border: "1px solid #EAEDF2", background: "#fff", fontWeight: 600, cursor: "pointer" }}>Rs 1000</button>
              <button onClick={() => handleQuickCash(2000)} style={{ padding: "12px", borderRadius: "8px", border: "1px solid #EAEDF2", background: "#fff", fontWeight: 600, cursor: "pointer" }}>Rs 2000</button>
              <button onClick={() => handleQuickCash(5000)} style={{ padding: "12px", borderRadius: "8px", border: "1px solid #EAEDF2", background: "#fff", fontWeight: 600, cursor: "pointer" }}>Rs 5000</button>
              <button onClick={() => handleQuickCash(cashNum + 100)} style={{ padding: "12px", borderRadius: "8px", border: "1px solid #EAEDF2", background: "#fff", fontWeight: 600, cursor: "pointer" }}>+100</button>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: changeDue > 0 ? "#FEF3C7" : "#F3F5F8", borderRadius: "12px", marginBottom: "24px", border: changeDue > 0 ? "1px solid #FCD34D" : "none" }}>
              <span style={{ fontSize: "16px", fontWeight: 600, color: changeDue > 0 ? "#92400E" : "#6B7A8F" }}>Change Due:</span>
              <span style={{ fontSize: "24px", fontWeight: 800, color: changeDue > 0 ? "#D97706" : "#6B7A8F" }}>
                Rs {changeDue.toFixed(2)}
              </span>
            </div>

            <button onClick={confirmPayment} disabled={cashNum < totalAmount} style={{ width: "100%", padding: "16px", borderRadius: "10px", border: "none", background: cashNum >= totalAmount ? "#0D9488" : "#E5E7EB", color: cashNum >= totalAmount ? "#fff" : "#9CA3AF", fontSize: "18px", fontWeight: 700, cursor: cashNum >= totalAmount ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", transition: "all 0.2s" }}>
              <CheckCircle2 size={20} /> Confirm Payment
            </button>
          </div>
        </div>
      )}

      {/* ✅ DIGITAL PAYMENT MODAL */}
      {showPaymentModal === "Digital" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000 }}>
          <div style={{ background: "#fff", borderRadius: "16px", width: "100%", maxWidth: "440px", padding: "24px", boxShadow: "0 24px 48px rgba(0,0,0,0.2)", position: "relative" }}>
            
            <button onClick={() => setShowPaymentModal(false)} style={{ position: "absolute", top: 16, right: 16, background: "#f1f5f9", border: "none", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <X size={18} />
            </button>

            <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 20px 0", display: "flex", alignItems: "center", gap: 8, color: "#12203A" }}>
              <CreditCard color="#1E293B" /> Digital Payment
            </h2>

            <div style={{ background: "#F3F5F8", padding: "16px", borderRadius: "12px", textAlign: "center", marginBottom: "24px" }}>
              <div style={{ fontSize: "13px", color: "#6B7A8F", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Amount</div>
              <div style={{ fontSize: "36px", fontWeight: 800, color: "#12203A", marginTop: "4px" }}>
                Rs {totalAmount.toFixed(2)}
              </div>
            </div>

            <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "12px", color: "#12203A" }}>Select Payment Method</label>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "24px" }}>
              <button onClick={() => setDigitalMethod("JazzCash / Easypaisa")} style={{ padding: "16px", borderRadius: "12px", border: `2px solid ${digitalMethod === "JazzCash / Easypaisa" ? "var(--color-primary)" : "#EAEDF2"}`, background: digitalMethod === "JazzCash / Easypaisa" ? "var(--color-primary-soft)" : "#fff", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                <Smartphone size={24} color={digitalMethod === "JazzCash / Easypaisa" ? "var(--color-primary)" : "#64748B"} />
                <span style={{ fontSize: "13px", fontWeight: 600 }}>JazzCash / Easypaisa</span>
              </button>

              <button onClick={() => setDigitalMethod("Debit / Credit Card")} style={{ padding: "16px", borderRadius: "12px", border: `2px solid ${digitalMethod === "Debit / Credit Card" ? "var(--color-primary)" : "#EAEDF2"}`, background: digitalMethod === "Debit / Credit Card" ? "var(--color-primary-soft)" : "#fff", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                <CreditCard size={24} color={digitalMethod === "Debit / Credit Card" ? "var(--color-primary)" : "#64748B"} />
                <span style={{ fontSize: "13px", fontWeight: 600 }}>Debit / Credit Card</span>
              </button>

              <button onClick={() => setDigitalMethod("Bank Transfer")} style={{ padding: "16px", borderRadius: "12px", border: `2px solid ${digitalMethod === "Bank Transfer" ? "var(--color-primary)" : "#EAEDF2"}`, background: digitalMethod === "Bank Transfer" ? "var(--color-primary-soft)" : "#fff", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", gridColumn: "1 / -1" }}>
                <Building2 size={24} color={digitalMethod === "Bank Transfer" ? "var(--color-primary)" : "#64748B"} />
                <span style={{ fontSize: "13px", fontWeight: 600 }}>Direct Bank Transfer (IBFT)</span>
              </button>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px", color: "#12203A" }}>Transaction ID / Last 4 Digits (Optional)</label>
              <input type="text" value={digitalRef} onChange={(e) => setDigitalRef(e.target.value)} placeholder="e.g., 1234" style={{ width: "100%", padding: "14px", fontSize: "16px", borderRadius: "8px", border: "1px solid #EAEDF2", outline: "none", background: "#F8FAFC" }} />
            </div>

            <button onClick={confirmDigitalPayment} disabled={!digitalMethod} style={{ width: "100%", padding: "16px", borderRadius: "10px", border: "none", background: digitalMethod ? "#1E293B" : "#E5E7EB", color: digitalMethod ? "#fff" : "#9CA3AF", fontSize: "18px", fontWeight: 700, cursor: digitalMethod ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              <CheckCircle2 size={20} /> Confirm Digital Payment
            </button>
          </div>
        </div>
      )}

      {/* ✅ UDHAAR / CREDIT MODAL */}
      {showCreditModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000 }}>
          <div style={{ background: "#fff", borderRadius: "16px", width: "100%", maxWidth: "400px", padding: "32px 24px", boxShadow: "0 24px 48px rgba(0,0,0,0.2)", textAlign: "center" }}>
            
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Clock size={32} color="#D97706" />
            </div>

            <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#12203A", margin: "0 0 8px 0" }}>Udhaar (Credit)</h2>
            <p style={{ color: "#6B7A8F", fontSize: "14px", marginBottom: "24px" }}>
              This will add <strong>Rs {totalAmount?.toFixed(2)}</strong> to the selected customer's Khata.
            </p>

            {!selectedCustomer ? (
              <div style={{ background: "#FEE2E2", color: "#991B1B", padding: "12px", borderRadius: "8px", fontSize: "13px", marginBottom: "24px" }}>
                Please select a Customer first! Udhaar cannot be given to a Walk-in customer.
              </div>
            ) : (
              <div style={{ background: "#F3F5F8", padding: "12px", borderRadius: "8px", fontSize: "14px", marginBottom: "24px", fontWeight: 500 }}>
                Customer: {selectedCustomer.name}
              </div>
            )}

            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={() => setShowCreditModal(false)} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid #EAEDF2", background: "#fff", fontWeight: 600, cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={() => { processTransaction("Credit", true); setShowCreditModal(false); }} disabled={!selectedCustomer} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "none", background: selectedCustomer ? "#D97706" : "#E5E7EB", color: selectedCustomer ? "#fff" : "#9CA3AF", fontWeight: 600, cursor: selectedCustomer ? "pointer" : "not-allowed" }}>
                Confirm Udhaar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default POSModals;