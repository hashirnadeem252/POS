// components/sales/POSBottomActions.jsx
import { useEffect } from "react";
import { Pin, X, RotateCcw, CreditCard, Banknote, Clock, List } from "lucide-react";
import { useTranslation } from "react-i18next";

function POSBottomActions({
  mode,
  saleData,
  setSaleData,
  resetAll,
  onClear = resetAll,
  cartItems = [],
  processTransaction,
  processReturn,
  handleHold,
  onOpenHeldSales,
}) {
  const { t } = useTranslation();
  const canProcessReturn = cartItems.some(
    (item) =>
      !item.isVoid &&
      ((item.itemType === "return" && Number(item.returnQty) > 0) ||
        (item.itemType === "exchange" && Number(item.quantity) > 0))
  );

  // Keyboard Shortcuts for Cashiers
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (mode === "sale") {
        if (e.key === "F1") {
          e.preventDefault();
          processTransaction("Cash");
        } else if (e.key === "F2") {
          e.preventDefault();
          processTransaction("Card/QR");
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mode, processTransaction]);

  return (
    <div className="pos-bottom">
      {/* Comment / Notes */}
      <div className="pos-bottom-notes">
        <input
          type="text"
          className="input"
          placeholder={t("pos.notesPlaceholder")}
          value={saleData.comments}
          onChange={(e) => setSaleData((prev) => ({ ...prev, comments: e.target.value }))}
        />
      </div>

      {/* Action Buttons */}
      <div className="pos-bottom-actions">
        {/* ✅ CLEANED: Held / hold / Clear Buttons */}
        <div className="pos-management-actions">
          {mode === "sale" && (
            <>
              <button
                type="button"
                className="btn btn-outline"
                onClick={onOpenHeldSales}
                title={t("pos.parked")}
              >
                <List size={18} /> {t("pos.parked")}
              </button>

              <button
                type="button"
                className="btn btn-outline"
                onClick={handleHold}
                title={t("pos.hold")}
              >
                <Pin size={18} /> {t("pos.hold")}
              </button>
            </>
          )}
          <button
            type="button"
            className="btn pos-clear-action"
            onClick={onClear}
            title={t("pos.clear")}
          >
            <X size={18} /> {t("pos.clear")}
          </button>
        </div>

        {/* Payment Buttons */}
        <div className="pos-payment-actions">
          {mode === "return" ? (
            <button
              type="button"
              className="btn btn-warning pos-process-return"
              onClick={processReturn}
              disabled={!canProcessReturn}
              title={
                canProcessReturn
                  ? "Process this return or exchange"
                  : "Select return or exchange items first"
              }
            >
              <RotateCcw size={20} />
              {mode === "return" && cartItems.some(
                (item) => !item.isVoid && item.itemType === "exchange"
              )
                ? "Process Return / Exchange"
                : t("pos.returnProcess")}
            </button>
          ) : (
            <>
            <button
              className="btn"
              onClick={() => processTransaction("Credit")}
              style={{ background: "#F59E0B", borderColor: "#F59E0B", color: "#fff" }}
            >
              <Clock size={20} /> {t("pos.udhaar")}
            </button>

            <button
              className="btn btn-primary"
              onClick={() => processTransaction("Card/QR")}
              style={{ background: "#1E293B", borderColor: "#1E293B" }}
            >
              <CreditCard size={20} /> {t("pos.digital")}
            </button>
            
            <button
              className="btn btn-success"
              onClick={() => processTransaction("Cash")}
              style={{ background: "var(--color-primary)", borderColor: "var(--color-primary)" }}
            >
              <Banknote size={22} /> {t("pos.payCash")}
            </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default POSBottomActions;