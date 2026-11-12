// components/sales/POSReturnSearch.jsx
import { Search, Loader2, ArrowRight } from "lucide-react";

function POSReturnSearch({
  returnInvoiceNumber,
  setReturnInvoiceNumber,
  searchSaleForReturn,
  searchingSale,
  startManualReturn,
}) {
  return (
    <div className="return-search-section">
      <div className="return-search-box">
        <label className="return-search-label">Enter Invoice Number</label>

        <div className="return-search-input">
          <input
            type="text"
            className="input"
            placeholder="e.g., INV-2409-1234"
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
                Searching...
              </>
            ) : (
              <>
                <Search size={14} strokeWidth={2} />
                Search
              </>
            )}
          </button>

          <button className="btn btn-outline" onClick={startManualReturn}>
            <ArrowRight size={14} strokeWidth={2} />
            Skip (Manual)
          </button>
        </div>

        <div className="return-hint">
          Search an invoice or click "Skip" for a manual return
        </div>
      </div>
    </div>
  );
}

export default POSReturnSearch;