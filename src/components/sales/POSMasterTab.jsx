// components/sales/POSMasterTab.jsx
import { Search, X, Info, Calendar, Clock, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

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
  // ✅ NEW PROPS
  onQuickAddCustomer,
  onQuickAddSalesPerson,
}) {
  const { t, i18n } = useTranslation();

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

            {/* Search Results */}
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
            
            {/* ✅ Empty State */}
            {salesPersonSearch && filteredSalesPersons.length === 0 && (
              <div className="search-results" style={{ padding: "12px", textAlign: "center", fontSize: "12px", color: "#6B7A8F" }}>
                {t("pos.noSalesPerson")}
              </div>
            )}
          </div>

          {/* ✅ Quick Add Button */}
          <button className="btn btn-outline btn-sm lookup-btn" onClick={onQuickAddSalesPerson} style={{ color: "#0D9488", borderColor: "#0D9488", padding: "0 10px" }} title={t("pos.quickAddSalesPerson")} aria-label={t("pos.quickAddSalesPerson")}>
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

            {/* Search Results */}
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

            {/* ✅ Empty State */}
            {customerSearch && filteredCustomers.length === 0 && (
              <div className="search-results" style={{ padding: "12px", textAlign: "center", fontSize: "12px", color: "#6B7A8F" }}>
                {t("pos.noCustomer")}
              </div>
            )}
          </div>

          {/* ✅ Quick Add Button */}
          <button className="btn btn-outline btn-sm lookup-btn" onClick={onQuickAddCustomer} style={{ color: "#0D9488", borderColor: "#0D9488", padding: "0 10px" }} title={t("pos.quickAddCustomer")} aria-label={t("pos.quickAddCustomer")}>
            <Plus size={16} />
          </button>

          <button className="btn btn-outline btn-sm lookup-btn" onClick={() => setShowCustomerModal(true)}>
            <Search size={13} strokeWidth={2} /> {t("pos.lookup")}
          </button>
        </div>

        {selectedCustomer && (
          <div className="selected-item">
            <span>{selectedCustomer.name}</span>
            <button className="btn-clear" onClick={() => { setSelectedCustomer(null); setSaleData((prev) => ({ ...prev, customerId: "" })); }}>
              <X size={12} strokeWidth={2.5} />
            </button>
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

      {/* Original sale info & Return mode help remain unchanged */}
      {/* ... */}
    </div>
  );
}

export default POSMasterTab;