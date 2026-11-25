// components/sales/POSReturnSearch.jsx
import { Search, Loader2, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";

function POSReturnSearch({
  returnInvoiceNumber,
  setReturnInvoiceNumber,
  searchSaleForReturn,
  searchingSale,
  startManualReturn,
}) {
  const { t } = useTranslation();

  return (
    <div className="return-search-section">
      <div className="return-search-box">
        <label className="return-search-label">{t("pos.enterInvoice")}</label>

        <div className="return-search-input">
          <input
            type="text"
            className="input"
            placeholder={t("pos.invoicePlaceholder")}
            value={returnInvoiceNumber}
            onChange={(e) => setReturnInvoiceNumber(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchSaleForReturn()}
          />

          <button
            className="btn btn-primary"
            onClick={searchSaleForReturn}
            disabled={searchingSale}
          >
            {searchingSale ? (
              <>
                <Loader2 size={14} className="spinning" />
                {t("pos.searching")}
              </>
            ) : (
              <>
                <Search size={14} strokeWidth={2} />
                {t("common.search")}
              </>
            )}
          </button>

          <button className="btn btn-outline" onClick={startManualReturn}>
            <ArrowRight size={14} strokeWidth={2} />
            {t("pos.skipManual")}
          </button>
        </div>

        <div className="return-hint">
          {t("pos.returnSearchHint")}
        </div>
      </div>
    </div>
  );
}

export default POSReturnSearch;