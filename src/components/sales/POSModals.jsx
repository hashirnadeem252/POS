// components/sales/POSModals.jsx
import { useState } from "react";
import { Banknote, CreditCard, X, CheckCircle2, Clock, Smartphone, Building2 } from "lucide-react";
import ItemLookupModal from "../common/ItemLookupModal";
import EntityLookupModal from "../common/EntityLookupModal";
import InvoiceModal from "./InvoiceModal";
import { notify } from "../../utils/notify";
import { useTranslation } from "react-i18next";
import { useSettings } from "../../contexts/SettingsContext";

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
  onPrint,
  showPaymentModal,
  setShowPaymentModal,
  showCreditModal,
  setShowCreditModal,
  saleData,
  processTransaction,
}) {
  const { t } = useTranslation();
    const { formatCurrency } = useSettings();

  // ✅ ALL HOOKS MUST BE AT THE TOP
  const [cashReceived, setCashReceived] = useState("");
  const [digitalMethod, setDigitalMethod] = useState("");
  const [digitalRef, setDigitalRef] = useState("");

  // ✅ EARLY RETURN MUST BE AFTER ALL HOOKS
  if (!showPaymentModal && !showProductModal && !showCustomerModal && !showSalesPersonModal && !showInvoiceModal && !showCreditModal) {
    return null;
  }

  const totalAmount = saleData?.total || 0;
  const cashNum = parseFloat(cashReceived) || 0;
  const changeDue = cashNum > totalAmount ? cashNum - totalAmount : 0;

  const closePaymentModal = () => {
    setCashReceived("");
    setDigitalMethod("");
    setDigitalRef("");
    setShowPaymentModal(false);
  };

  const handleQuickCash = (amount) => {
    setCashReceived(amount.toString());
  };

  const submitCashPayment = (receivedAmount) => {
    if (receivedAmount < totalAmount) {
      notify.warning(t("pos.cashTooLow"));
      return;
    }
    processTransaction("Cash", true);
    closePaymentModal();
  };

  const confirmPayment = () => submitCashPayment(cashNum);

  const confirmDigitalPayment = () => {
    if (!digitalMethod) {
      notify.warning(t("pos.selectPaymentMethodError"));
      return;
    }
    processTransaction(digitalMethod, true); 
    closePaymentModal();
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
        title={mode === "return" ? t("pos.selectItemsReturn") : t("pos.selectProducts")}
        searchPlaceholder={t("pos.searchProducts")}
        loading={false}
        emptyMessage={t("pos.noProductsFound")}
        multiSelect={true}
        columns={productLookupColumns}
      />

      {/* Customer Lookup */}
      <EntityLookupModal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        onSelect={selectCustomer}
        items={customers}
        selectedItem={selectedCustomer}
        idField="customerId"
        title={t("pos.selectCustomerTitle")}
        searchPlaceholder={t("pos.searchCustomerLookup")}
        emptyMessage={t("pos.noCustomersFound")}
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
        title={t("pos.selectSalesPersonTitle")}
        searchPlaceholder={t("pos.searchSalesPersonLookup")}
        emptyMessage={t("pos.noSalesPersonsFound")}
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
            
            <button onClick={closePaymentModal} style={{ position: "absolute", top: 16, right: 16, background: "#f1f5f9", border: "none", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <X size={18} />
            </button>

            <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 20px 0", display: "flex", alignItems: "center", gap: 8, color: "#12203A" }}>
              <Banknote color="#0D9488" /> {t("pos.cashPayment")}
            </h2>

            <div style={{ background: "#F3F5F8", padding: "16px", borderRadius: "12px", textAlign: "center", marginBottom: "24px" }}>
              <div style={{ fontSize: "13px", color: "#6B7A8F", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{t("pos.totalAmount")}</div>
              <div style={{ fontSize: "36px", fontWeight: 800, color: "#12203A", marginTop: "4px" }}>
              {formatCurrency(totalAmount)}
              </div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px", color: "#12203A" }}>{t("pos.cashReceived")}</label>
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
                placeholder={t("pos.enterAmount")}
                style={{ width: "100%", padding: "16px", fontSize: "24px", fontWeight: 700, textAlign: "center", borderRadius: "8px", border: "2px solid #0D9488", outline: "none", background: "#E6F7F5", color: "#0F766E" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "24px" }}>
              <button onClick={() => { setCashReceived(totalAmount.toString()); submitCashPayment(totalAmount); }} style={{ padding: "12px", borderRadius: "8px", border: "1px solid #EAEDF2", background: "#fff", fontWeight: 600, cursor: "pointer" }}>{t("pos.exact")}</button>
              <button onClick={() => handleQuickCash(500)} style={{ padding: "12px", borderRadius: "8px", border: "1px solid #EAEDF2", background: "#fff", fontWeight: 600, cursor: "pointer" }}>Rs 500</button>
              <button onClick={() => handleQuickCash(1000)} style={{ padding: "12px", borderRadius: "8px", border: "1px solid #EAEDF2", background: "#fff", fontWeight: 600, cursor: "pointer" }}>Rs 1000</button>
              <button onClick={() => handleQuickCash(2000)} style={{ padding: "12px", borderRadius: "8px", border: "1px solid #EAEDF2", background: "#fff", fontWeight: 600, cursor: "pointer" }}>Rs 2000</button>
              <button onClick={() => handleQuickCash(5000)} style={{ padding: "12px", borderRadius: "8px", border: "1px solid #EAEDF2", background: "#fff", fontWeight: 600, cursor: "pointer" }}>Rs 5000</button>
              <button onClick={() => handleQuickCash(cashNum + 100)} style={{ padding: "12px", borderRadius: "8px", border: "1px solid #EAEDF2", background: "#fff", fontWeight: 600, cursor: "pointer" }}>+100</button>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: changeDue > 0 ? "#FEF3C7" : "#F3F5F8", borderRadius: "12px", marginBottom: "24px", border: changeDue > 0 ? "1px solid #FCD34D" : "none" }}>
              <span style={{ fontSize: "16px", fontWeight: 600, color: changeDue > 0 ? "#92400E" : "#6B7A8F" }}>{t("pos.changeDue")}</span>
              <span style={{ fontSize: "24px", fontWeight: 800, color: changeDue > 0 ? "#D97706" : "#6B7A8F" }}>
                 {formatCurrency(changeDue)}
              </span>
            </div>

            <button onClick={confirmPayment} disabled={cashNum < totalAmount} style={{ width: "100%", padding: "16px", borderRadius: "10px", border: "none", background: cashNum >= totalAmount ? "#0D9488" : "#E5E7EB", color: cashNum >= totalAmount ? "#fff" : "#9CA3AF", fontSize: "18px", fontWeight: 700, cursor: cashNum >= totalAmount ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", transition: "all 0.2s" }}>
              <CheckCircle2 size={20} /> {t("pos.confirmPayment")}
            </button>
          </div>
        </div>
      )}

      {/* ✅ DIGITAL PAYMENT MODAL */}
      {showPaymentModal === "Digital" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000 }}>
          <div style={{ background: "#fff", borderRadius: "16px", width: "100%", maxWidth: "440px", padding: "24px", boxShadow: "0 24px 48px rgba(0,0,0,0.2)", position: "relative" }}>
            
            <button onClick={closePaymentModal} style={{ position: "absolute", top: 16, right: 16, background: "#f1f5f9", border: "none", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <X size={18} />
            </button>

            <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 20px 0", display: "flex", alignItems: "center", gap: 8, color: "#12203A" }}>
              <CreditCard color="#1E293B" /> {t("pos.digitalPayment")}
            </h2>

            <div style={{ background: "#F3F5F8", padding: "16px", borderRadius: "12px", textAlign: "center", marginBottom: "24px" }}>
              <div style={{ fontSize: "13px", color: "#6B7A8F", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{t("pos.totalAmount")}</div>
              <div style={{ fontSize: "36px", fontWeight: 800, color: "#12203A", marginTop: "4px" }}>
                  {formatCurrency(totalAmount)}
              </div>
            </div>

            <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "12px", color: "#12203A" }}>{t("pos.selectPaymentMethod")}</label>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "24px" }}>
              <button onClick={() => setDigitalMethod("JazzCash / Easypaisa")} style={{ padding: "16px", borderRadius: "12px", border: `2px solid ${digitalMethod === "JazzCash / Easypaisa" ? "var(--color-primary)" : "#EAEDF2"}`, background: digitalMethod === "JazzCash / Easypaisa" ? "var(--color-primary-soft)" : "#fff", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                <Smartphone size={24} color={digitalMethod === "JazzCash / Easypaisa" ? "var(--color-primary)" : "#64748B"} />
                <span style={{ fontSize: "13px", fontWeight: 600 }}>JazzCash / Easypaisa</span>
              </button>

              <button onClick={() => setDigitalMethod("Debit / Credit Card")} style={{ padding: "16px", borderRadius: "12px", border: `2px solid ${digitalMethod === "Debit / Credit Card" ? "var(--color-primary)" : "#EAEDF2"}`, background: digitalMethod === "Debit / Credit Card" ? "var(--color-primary-soft)" : "#fff", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                <CreditCard size={24} color={digitalMethod === "Debit / Credit Card" ? "var(--color-primary)" : "#64748B"} />
                <span style={{ fontSize: "13px", fontWeight: 600 }}>{t("pos.cardPayment")}</span>
              </button>

              <button onClick={() => setDigitalMethod("Bank Transfer")} style={{ padding: "16px", borderRadius: "12px", border: `2px solid ${digitalMethod === "Bank Transfer" ? "var(--color-primary)" : "#EAEDF2"}`, background: digitalMethod === "Bank Transfer" ? "var(--color-primary-soft)" : "#fff", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", gridColumn: "1 / -1" }}>
                <Building2 size={24} color={digitalMethod === "Bank Transfer" ? "var(--color-primary)" : "#64748B"} />
                <span style={{ fontSize: "13px", fontWeight: 600 }}>{t("pos.bankTransfer")}</span>
              </button>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px", color: "#12203A" }}>{t("pos.paymentReference")}</label>
              <input type="text" value={digitalRef} onChange={(e) => setDigitalRef(e.target.value)} placeholder="e.g., 1234" dir="ltr" style={{ width: "100%", padding: "14px", fontSize: "16px", borderRadius: "8px", border: "1px solid #EAEDF2", outline: "none", background: "#F8FAFC" }} />
            </div>

            <button onClick={confirmDigitalPayment} disabled={!digitalMethod} style={{ width: "100%", padding: "16px", borderRadius: "10px", border: "none", background: digitalMethod ? "#1E293B" : "#E5E7EB", color: digitalMethod ? "#fff" : "#9CA3AF", fontSize: "18px", fontWeight: 700, cursor: digitalMethod ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              <CheckCircle2 size={20} /> {t("pos.confirmDigital")}
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

            <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#12203A", margin: "0 0 8px 0" }}>{t("pos.udhaarPayment")}</h2>
            <p style={{ color: "#6B7A8F", fontSize: "14px", marginBottom: "24px" }}>
              {t("pos.creditDescription", { amount: formatCurrency(totalAmount) })}
            </p>

            {!selectedCustomer ? (
              <div style={{ background: "#FEE2E2", color: "#991B1B", padding: "12px", borderRadius: "8px", fontSize: "13px", marginBottom: "24px" }}>
                {t("pos.selectCustomerFirst")}
              </div>
            ) : (
              <div style={{ background: "#F3F5F8", padding: "12px", borderRadius: "8px", fontSize: "14px", marginBottom: "24px", fontWeight: 500 }}>
                {t("pos.customer")}: {selectedCustomer.name}
              </div>
            )}

            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={() => setShowCreditModal(false)} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid #EAEDF2", background: "#fff", fontWeight: 600, cursor: "pointer" }}>
                {t("common.cancel")}
              </button>
              <button onClick={() => { processTransaction("Credit", true); setShowCreditModal(false); }} disabled={!selectedCustomer} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "none", background: selectedCustomer ? "#D97706" : "#E5E7EB", color: selectedCustomer ? "#fff" : "#9CA3AF", fontWeight: 600, cursor: selectedCustomer ? "pointer" : "not-allowed" }}>
                {t("pos.confirmUdhaar")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default POSModals;