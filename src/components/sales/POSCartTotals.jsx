// components/sales/POSCartTotals.jsx
import { Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSettings } from "../../contexts/SettingsContext";

function POSCartTotals({
  mode,
  saleData,
  cartItems,
  returnCount,
  exchangeCount,
}) {
  const { t } = useTranslation();
  const { formatCurrency } = useSettings();

  const subTotal = saleData.subTotal || 0;
  const discount = saleData.discount || 0;
  const tax = saleData.tax || 0;
  const total = saleData.total || 0;
  const returnValue = cartItems
    .filter((item) => !item.isVoid && item.itemType === "return")
    .reduce(
      (sum, item) =>
        sum +
        Math.max(
          0,
          (Number(item.returnQty) || 0) * (Number(item.retailPrice) || 0) -
            (Number(item.discount) || 0)
        ),
      0
    );
  const exchangeValue = cartItems
    .filter((item) => !item.isVoid && item.itemType === "exchange")
    .reduce(
      (sum, item) =>
        sum +
        Math.max(
          0,
          (Number(item.quantity) || 0) * (Number(item.retailPrice) || 0) -
            (Number(item.discount) || 0)
        ),
      0
    );
  const settlement = exchangeValue - returnValue;

  return (
    <div className="cart-footer" style={{ background: "#F8FAFC", borderTop: "2px dashed var(--color-border)", padding: "16px 20px" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {mode === "return" ? (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: "var(--color-text-secondary)" }}>
              <span>Return / refund value</span>
              <span>{formatCurrency(returnValue)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: "var(--color-text-secondary)" }}>
              <span>Exchange item value</span>
              <span>{formatCurrency(exchangeValue)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px", paddingTop: "12px", borderTop: "1px solid var(--color-border)" }}>
              <span style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)" }}>
                {settlement > 0
                  ? "Customer pays"
                  : settlement < 0
                  ? "Refund due"
                  : "Balance"}
              </span>
              <span style={{ fontSize: "22px", fontWeight: 800, color: "var(--color-primary)" }}>
                {formatCurrency(Math.abs(settlement))}
              </span>
            </div>
            {returnCount > 0 && exchangeCount > 0 && (
              <div style={{ marginTop: "8px", padding: "8px 12px", background: "#FEF3C7", borderRadius: "6px", display: "flex", gap: "8px", alignItems: "center", fontSize: "12px", color: "#92400E", fontWeight: 600 }}>
                <Info size={14} />
                <span>Exchange difference is settled against the returned items.</span>
              </div>
            )}
          </>
        ) : (
          <>

        {/* Sub Total (Net Sales) */}
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: "var(--color-text-secondary)" }}>
          <span>{t("pos.subTotal")}</span>
          <span>Rs {subTotal.toFixed(2)}</span>
        </div>

        {/* Discount */}
        {discount > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: "var(--color-danger)" }}>
            <span>{t("pos.discount")}</span>
            <span>- Rs {discount.toFixed(2)}</span>
          </div>
        )}

        {/* Tax (Included) */}
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--color-text-secondary)" }}>
          <span>Tax (Included)</span>
          <span>Rs {tax.toFixed(2)}</span>
        </div>

        {/* Net Total */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px", paddingTop: "12px", borderTop: "1px solid var(--color-border)" }}>
          <span style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-text-primary)" }}>{t("pos.netTotal")}</span>
          <span style={{ fontSize: "24px", fontWeight: 800, color: "var(--color-primary)" }}>
            Rs {total.toFixed(2)}
          </span>
        </div>

        {exchangeCount > 0 && returnCount > 0 && (
          <div style={{ marginTop: "12px", padding: "8px 12px", background: "#FEF3C7", borderRadius: "6px", display: "flex", gap: "8px", alignItems: "center", fontSize: "12px", color: "#92400E", fontWeight: 600 }}>
            <Info size={14} />
            <span>{t("pos.returnCombined")}</span>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
}

export default POSCartTotals;