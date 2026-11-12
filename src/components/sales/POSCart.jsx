// components/sales/POSCart.jsx
import {
  ShoppingCart,
  RotateCcw,
  ArrowLeftRight,
  Ban,
  RotateCw,
  Trash2,
  Minus,
  Plus,
} from "lucide-react";
import POSCartTotals from "./POSCartTotals";

function POSCart({
  mode,
  cartItems,
  activeCount,
  voidedCount,
  returnCount,
  exchangeCount,
  updateReturnQuantity,
  updateExchangeQuantity,
  updateSaleQuantity,
  updateDiscount,
  toggleVoid,
  removeItem,
  toggleItemType,
  saleData,
}) {
  return (
    <div className="pos-center">
      {/* Header */}
      <div className="cart-header">
        <h3 className="cart-title">
          {mode === "return" ? (
            <>
              <RotateCcw size={16} strokeWidth={2} />
              Return / Exchange Cart
            </>
          ) : (
            <>
              <ShoppingCart size={16} strokeWidth={2} />
              Cart
            </>
          )}
        </h3>

        <div className="cart-stats">
          {returnCount > 0 && (
            <span className="stat-badge stat-return">
              <RotateCcw size={11} strokeWidth={2.5} />
              {returnCount} returns
            </span>
          )}
          {exchangeCount > 0 && (
            <span className="stat-badge stat-exchange">
              <ArrowLeftRight size={11} strokeWidth={2.5} />
              {exchangeCount} exchange
            </span>
          )}
          <span className="stat-badge stat-total">
            {activeCount} total
          </span>
          {voidedCount > 0 && (
            <span className="stat-badge stat-void">
              <Ban size={11} strokeWidth={2.5} />
              {voidedCount} voided
            </span>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="cart-items-container">
        {cartItems.length === 0 ? (
          <div className="empty-cart">
            <ShoppingCart size={36} strokeWidth={1.25} />
            <p>No items in cart</p>
            <p className="empty-hint">
              {mode === "return"
                ? "Add items from the list to return or exchange"
                : "Click a product to add it to the cart"}
            </p>
          </div>
        ) : (
          <table className="cart-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Product</th>
                <th>Code</th>
                <th>Qty</th>
                <th>Type</th>
                <th>Discount</th>
                <th>Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {cartItems.map((item, index) => {
                const isVoided = item.isVoid || item.rowState === "Deleted";

                // ✅ Single source of truth for the type
                const isReturnItem = item.itemType === "return";
                const isExchangeItem = item.itemType === "exchange";
                const isSaleItem = item.itemType === "sale";

                // ✅ Sale items from an invoice are LOCKED until toggled
                const isLockedInvoiceSale =
                  isSaleItem &&
                  item.isFromOriginalInvoice === true &&
                  mode === "return";

                // ✅ Sale badge should be clickable only when toggling makes sense
                const canToggleSaleBadge = isLockedInvoiceSale && !isVoided;

                return (
                  <tr key={index} className={isVoided ? "voided-row" : ""}>
                    <td className="cell-index">{index + 1}</td>

                    <td className="cell-product">
                      <span
                        className={`item-name ${
                          isReturnItem
                            ? "return-item-text"
                            : isExchangeItem
                            ? "exchange-item-text"
                            : ""
                        }`}
                      >
                        {item.productName || `Product ${item.productId}`}
                      </span>
                      {isVoided && <span className="void-badge">VOID</span>}
                    </td>

                    <td>
                      <span className="item-code">{item.productCode}</span>
                    </td>

                    {/* Quantity column */}
                    <td>
                      {isReturnItem ? (
                        <div className="qty-control">
                          <button
                            className="qty-btn"
                            onClick={() => updateReturnQuantity(index, -1)}
                            disabled={isVoided || (item.returnQty || 0) <= 0}
                          >
                            <Minus size={12} strokeWidth={2.5} />
                          </button>
                          <span className="qty-value return-qty">
                            {item.returnQty || 0}
                          </span>
                          <button
                            className="qty-btn"
                            onClick={() => updateReturnQuantity(index, 1)}
                            disabled={
                              isVoided ||
                              (item.returnQty || 0) >=
                                (item.maxReturn || 999)
                            }
                          >
                            <Plus size={12} strokeWidth={2.5} />
                          </button>
                          <span className="max-qty">
                            / {item.maxReturn || 0}
                          </span>
                        </div>
                      ) : isExchangeItem ? (
                        <div className="qty-control">
                          <button
                            className="qty-btn"
                            onClick={() =>
                              updateExchangeQuantity(index, -1)
                            }
                            disabled={isVoided || (item.quantity || 0) <= 1}
                          >
                            <Minus size={12} strokeWidth={2.5} />
                          </button>
                          <span className="qty-value">{item.quantity}</span>
                          <button
                            className="qty-btn"
                            onClick={() => updateExchangeQuantity(index, 1)}
                            disabled={isVoided}
                          >
                            <Plus size={12} strokeWidth={2.5} />
                          </button>
                        </div>
                      ) : (
                        // Sale item — disabled if from invoice in return mode
                        <div className="qty-control">
                          <button
                            className="qty-btn"
                            onClick={() => updateSaleQuantity(index, -1)}
                            disabled={
                              isVoided ||
                              isLockedInvoiceSale ||
                              (item.quantity || 0) <= 1
                            }
                            title={
                              isLockedInvoiceSale
                                ? "Click the Sale badge to mark as Return"
                                : ""
                            }
                          >
                            <Minus size={12} strokeWidth={2.5} />
                          </button>
                          <span className="qty-value">{item.quantity}</span>
                          <button
                            className="qty-btn"
                            onClick={() => updateSaleQuantity(index, 1)}
                            disabled={isVoided || isLockedInvoiceSale}
                            title={
                              isLockedInvoiceSale
                                ? "Click the Sale badge to mark as Return"
                                : ""
                            }
                          >
                            <Plus size={12} strokeWidth={2.5} />
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Type badge */}
                    <td>
                      {isReturnItem ? (
                        <button
                          className="type-badge return-type"
                          onClick={() => !isVoided && toggleItemType(index)}
                          disabled={isVoided}
                          title="Click to change to Sale"
                        >
                          <RotateCcw size={11} strokeWidth={2.5} />
                          Return
                        </button>
                      ) : isExchangeItem ? (
                        <button
                          className="type-badge exchange-type"
                          onClick={() => !isVoided && toggleItemType(index)}
                          disabled={isVoided}
                          title="Click to change to Return"
                        >
                          <ArrowLeftRight size={11} strokeWidth={2.5} />
                          Exchange
                        </button>
                      ) : canToggleSaleBadge ? (
                        // ✅ Clickable Sale badge — toggles to Return
                        <button
                          className="type-badge sale-type clickable"
                          onClick={() => toggleItemType(index)}
                          title="Click to mark this item as a Return"
                        >
                          <ShoppingCart size={11} strokeWidth={2.5} />
                          Sale
                        </button>
                      ) : (
                        // Non-clickable Sale badge (e.g., normal sale mode)
                        <span className="type-badge sale-type">
                          <ShoppingCart size={11} strokeWidth={2.5} />
                          Sale
                        </span>
                      )}
                    </td>

                    {/* Discount */}
                    <td>
                      <input
                        type="number"
                        className="input-sm"
                        value={item.discount}
                        onChange={(e) =>
                          updateDiscount(index, e.target.value)
                        }
                        step="0.01"
                        disabled={isVoided}
                      />
                    </td>

                    {/* Total */}
                    <td
                      className={`item-total ${
                        isReturnItem
                          ? "return-total"
                          : isExchangeItem
                          ? "exchange-total"
                          : ""
                      }`}
                    >
                      {isReturnItem
                        ? `-PKR ${Math.abs(item.total || 0).toFixed(2)}`
                        : `PKR ${(item.total || 0).toFixed(2)}`}
                    </td>

                    {/* Actions */}
                    <td>
                      {isVoided ? (
                        <button
                          className="btn-icon restore"
                          onClick={() => toggleVoid(index)}
                          title="Restore item"
                        >
                          <RotateCw size={14} strokeWidth={2} />
                        </button>
                      ) : (
                        <button
                          className="btn-icon void"
                          onClick={() => removeItem(index)}
                          title="Void item"
                        >
                          <Trash2 size={14} strokeWidth={2} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <POSCartTotals
        saleData={saleData}
        returnCount={returnCount}
        exchangeCount={exchangeCount}
      />
    </div>
  );
}

export default POSCart;