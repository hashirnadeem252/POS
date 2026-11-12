// components/sales/POSHeader.jsx
import {
  ShoppingCart,
  RotateCcw,
  Pencil,
  RefreshCw,
  Search,
  ClipboardList,
  X,
} from "lucide-react";
import { notify } from "../../utils/notify";

function POSHeader({
  mode,
  isEditing,
  saleData,
  resetAll,
  setMode,
  refreshProducts,
  onSearchSales,
  onViewReturns,
  exitPOS,
}) {
  const handleRefresh = async () => {
    try {
      await refreshProducts();
      notify.success("Products refreshed");
    } catch {
      notify.error("Failed to refresh products");
    }
  };

  return (
    <div className="pos-header">
      <div className="pos-header-left">
        <h1 className="pos-header-title">
          {mode === "return" ? (
            <>
              <RotateCcw size={20} strokeWidth={2} />
              Return / Exchange
            </>
          ) : isEditing ? (
            <>
              <Pencil size={20} strokeWidth={2} />
              Edit Sale
            </>
          ) : (
            <>
              <ShoppingCart size={20} strokeWidth={2} />
              Sale
            </>
          )}
        </h1>

        <span className="invoice-number">#{saleData.invoiceNumber}</span>

        {mode === "return" && (
          <span className="pos-badge return-badge">
            <RotateCcw size={12} strokeWidth={2.5} />
            RETURN / EXCHANGE MODE
          </span>
        )}

        {isEditing && mode === "sale" && (
          <span className="pos-badge edit-badge">
            <Pencil size={12} strokeWidth={2.5} />
            EDITING
          </span>
        )}
      </div>

      <div className="pos-header-center">
        <button
          className={`mode-btn ${mode === "sale" && !isEditing ? "active" : ""}`}
          onClick={resetAll}
        >
          <ShoppingCart size={15} strokeWidth={2} />
          Sale
        </button>
        <button
          className={`mode-btn ${mode === "return" ? "active" : ""}`}
          onClick={() => setMode("return")}
        >
          <RotateCcw size={15} strokeWidth={2} />
          Return / Exchange
        </button>
      </div>

      <div className="pos-header-right">
        <button className="btn btn-outline btn-sm" onClick={handleRefresh}>
          <RefreshCw size={14} strokeWidth={2} />
          Refresh
        </button>

        {mode === "sale" && (
          <button className="btn btn-outline btn-sm" onClick={onSearchSales}>
            <Search size={14} strokeWidth={2} />
            Search Sales
          </button>
        )}

        {mode === "return" && (
          <button className="btn btn-outline btn-sm" onClick={onViewReturns}>
            <ClipboardList size={14} strokeWidth={2} />
            View Returns
          </button>
        )}

        <button className="btn btn-danger btn-sm" onClick={exitPOS}>
          <X size={14} strokeWidth={2} />
          Exit
        </button>
      </div>
    </div>
  );
}

export default POSHeader;