// components/sales/POSMasterTab.jsx
import { useState } from "react";
import { Search, X, Info, Calendar, Clock, Plus, Receipt } from "lucide-react";
import { useTranslation } from "react-i18next";
import MonthlyStatementModal from "../customers/MonthlyStatementModal";

function POSMasterTab({
  salesPersonSearch,
  setSalesPersonSearch,
  filteredSalesPersons,
  selectSalesPerson,
  selectedSalesPerson,
  setSelectedSalesPerson,
  setSaleData,
  customerSearch,
  setCustomerSearch,
  filteredCustomers,
  selectCustomer,
  selectedCustomer,
  setSelectedCustomer,
  saleData,
  handleMasterChange,
  foundSale,
  setShowSalesPersonModal,
  setShowCustomerModal,
  mode,
  onQuickAddCustomer,
  onQuickAddSalesPerson,
}) {
  const { t, i18n } = useTranslation();
  const [statementCustomer, setStatementCustomer] = useState(null);

  return (
    <div className="master-tab">
      {/* Sales Person */}
      <div className="master-search-group">
        <label className="master-label">
          {t("pos.salesPerson")} <span className="optional-label">{t("pos.optional")}</span>
        </label>

        <div className="search-with-button">
          <div className="search-with-results">
            <div className="search-input-wrapper">
              <Search size={15} strokeWidth={2} />
              <input
                type="text"
                className="input"
                placeholder={t("pos.searchByCodeName")}
                value={salesPersonSearch}
                onChange={(e) => setSalesPersonSearch(e.target.value)}
              />
            </div>

            {salesPersonSearch && filteredSalesPersons.length > 0 && (
              <div className="search-results">
                {filteredSalesPersons.slice(0, 5).map((p) => (
                  <div key={p.salesPersonId} className="search-result-item" onClick={() => selectSalesPerson(p)}>
                    <span className="result-code">{p.code}</span>
                    <span className="result-name">{p.name}</span>
                  </div>
                ))}
              </div>
            )}
            
            {salesPersonSearch && filteredSalesPersons.length === 0 && (
              <div className="search-results" style={{ padding: "12px", textAlign: "center", fontSize: "12px", color: "#6B7A8F" }}>
                {t("pos.noSalesPerson")}
              </div>
            )}
          </div>

          <button className="btn btn-outline btn-sm lookup-btn" onClick={onQuickAddSalesPerson} style={{ color: "#0D9488", borderColor: "#0D9488", padding: "0 10px" }}>
            <Plus size={16} />
          </button>
          
          <button className="btn btn-outline btn-sm lookup-btn" onClick={() => setShowSalesPersonModal(true)}>
            <Search size={13} strokeWidth={2} /> {t("pos.lookup")}
          </button>
        </div>

        {selectedSalesPerson && (
          <div className="selected-item">
            <span>{selectedSalesPerson.name}</span>
            <button className="btn-clear" onClick={() => { setSelectedSalesPerson(null); setSaleData((prev) => ({ ...prev, salesPersonId: "" })); }}>
              <X size={12} strokeWidth={2.5} />
            </button>
          </div>
        )}
      </div>

      {/* Customer */}
      <div className="master-search-group">
        <label className="master-label">
          {t("pos.customer")} <span className="optional-label">{t("pos.optional")}</span>
        </label>

        <div className="search-with-button">
          <div className="search-with-results">
            <div className="search-input-wrapper">
              <Search size={15} strokeWidth={2} />
              <input
                type="text"
                className="input"
                placeholder={t("pos.searchCustomer")}
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
              />
            </div>

            {customerSearch && filteredCustomers.length > 0 && (
              <div className="search-results">
                {filteredCustomers.slice(0, 5).map((c) => (
                  <div key={c.customerId} className="search-result-item" onClick={() => selectCustomer(c)}>
                    <span className="result-code">{c.code}</span>
                    <span className="result-name">{c.name}</span>
                    <span className="result-phone">{c.phone}</span>
                  </div>
                ))}
              </div>
            )}

            {customerSearch && filteredCustomers.length === 0 && (
              <div className="search-results" style={{ padding: "12px", textAlign: "center", fontSize: "12px", color: "#6B7A8F" }}>
                {t("pos.noCustomer")}
              </div>
            )}
          </div>

          <button className="btn btn-outline btn-sm lookup-btn" onClick={onQuickAddCustomer} style={{ color: "#0D9488", borderColor: "#0D9488", padding: "0 10px" }}>
            <Plus size={16} />
          </button>

          <button className="btn btn-outline btn-sm lookup-btn" onClick={() => setShowCustomerModal(true)}>
            <Search size={13} strokeWidth={2} /> {t("pos.lookup")}
          </button>
        </div>

        {selectedCustomer && (
          <div className="selected-item" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span>{selectedCustomer.name}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {/* ✅ NEW: View Khata Button */}
              <button 
                onClick={() => setStatementCustomer(selectedCustomer)}
                className="btn btn-sm"
                style={{ background: "transparent", color: "var(--color-primary)", padding: "4px", display: "flex", alignItems: "center", gap: "4px", fontSize: "12px" }}
                title="View Monthly Khata"
              >
                <Receipt size={14} /> Khata
              </button>

              <button className="btn-clear" onClick={() => { setSelectedCustomer(null); setSaleData((prev) => ({ ...prev, customerId: "" })); }}>
                <X size={12} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sale Date - Read Only */}
      <div className="master-date">
        <label className="master-label">
          <Calendar size={13} strokeWidth={2} />
          {t("pos.currentDateTime")}
        </label>
        <div style={{ 
          padding: "10px 14px", 
          background: "var(--color-background)", 
          border: "1px solid var(--color-border)", 
          borderRadius: "var(--radius-md)",
          fontSize: "14px",
          color: "var(--color-text-secondary)",
          fontWeight: 500,
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          <Clock size={16} />
          {new Date().toLocaleString(i18n.resolvedLanguage?.startsWith("ur") ? "ur-PK" : "en-PK", {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
          })}
        </div>
      </div>

      {/* Original sale info & Return mode help */}
      {foundSale && (
        <div className="found-sale-info">
          <div className="found-sale-badge">
            <Info size={14} />
            <span>Original Sale: {foundSale.invoiceNumber}</span>
          </div>
          <div className="found-sale-details">
            <span>Date: {new Date(foundSale.saleDate).toLocaleDateString()}</span>
            <span>Total: PKR {foundSale.total.toFixed(2)}</span>
          </div>
        </div>
      )}

      {mode === "return" && !foundSale && (
        <div className="return-mode-help" style={{ padding: "12px", background: "#FEF3C7", borderRadius: "8px", fontSize: "12px", color: "#92400E", marginTop: "12px" }}>
          <Info size={14} style={{ display: "inline", marginRight: "6px", verticalAlign: "middle" }} />
          Manual Return Mode: You can add items to return without an original invoice.
        </div>
      )}

      {/* ✅ NEW: Monthly Statement Modal */}
      {statementCustomer && (
        <MonthlyStatementModal 
          customer={statementCustomer} 
          onClose={() => setStatementCustomer(null)} 
        />
      )}
    </div>
  );
}

export default POSMasterTab;