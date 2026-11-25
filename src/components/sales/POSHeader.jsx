// components/sales/POSHeader.jsx
import {
  ShoppingCart,
  RotateCcw,
  Pencil,
  Search,
  ClipboardList,
  X,
} from "lucide-react";
import MasterDataSyncStatus from "../common/MasterDataSyncStatus";
import LowStockAlert from "../common/LowStockAlert";
import { useTranslation } from "react-i18next";

function POSHeader({
  mode,
  isEditing,
  saleData,
  products,
  onSelectMode,
  onSearchSales,
  onViewReturns,
  exitPOS,
}) {
  const { t } = useTranslation();

  return (
    <div className="pos-header">
      <div className="pos-header-left">
        <h1 className="pos-header-title">
          {mode === "return" ? (
            <>
              <RotateCcw size={20} strokeWidth={2} />
              {t("pos.returnExchange")}
            </>
          ) : isEditing ? (
            <>
              <Pencil size={20} strokeWidth={2} />
              {t("pos.editSale")}
            </>
          ) : (
            <>
              <ShoppingCart size={20} strokeWidth={2} />
              {t("pos.sale")}
            </>
          )}
        </h1>

        {saleData.invoiceNumber && (
          <span className="invoice-number">#{saleData.invoiceNumber}</span>
        )}

        {mode === "return" && (
          <span className="pos-badge return-badge">
            <RotateCcw size={12} strokeWidth={2.5} />
            {t("pos.returnMode")}
          </span>
        )}

        {isEditing && mode === "sale" && (
          <span className="pos-badge edit-badge">
            <Pencil size={12} strokeWidth={2.5} />
            {t("pos.editing")}
          </span>
        )}
      </div>

      <div className="pos-header-center">
        <button
          type="button"
          className={`mode-btn sale-mode ${
            mode === "sale" ? "active" : ""
          }`}
          onClick={() => onSelectMode("sale")}
          aria-pressed={mode === "sale"}
        >
          <ShoppingCart size={15} strokeWidth={2} />
          {t("pos.saleMode")}
        </button>
        <button
          type="button"
          className={`mode-btn return-mode ${
            mode === "return" ? "active" : ""
          }`}
          onClick={() => onSelectMode("return")}
          aria-pressed={mode === "return"}
        >
          <RotateCcw size={15} strokeWidth={2} />
          {t("pos.returnExchange")}
        </button>
      </div>

      <div className="pos-header-right">
        <LowStockAlert products={products} />
        <MasterDataSyncStatus />

        {mode === "sale" && (
          <button className="btn btn-outline btn-sm" onClick={onSearchSales}>
            <Search size={14} strokeWidth={2} />
            {t("pos.searchSales")}
          </button>
        )}

        {mode === "return" && (
          <button className="btn btn-outline btn-sm" onClick={onViewReturns}>
            <ClipboardList size={14} strokeWidth={2} />
            {t("pos.viewReturns")}
          </button>
        )}

        <button className="btn btn-danger btn-sm" onClick={exitPOS}>
          <X size={14} strokeWidth={2} />
          {t("pos.exit")}
        </button>
      </div>
    </div>
  );
}

export default POSHeader;