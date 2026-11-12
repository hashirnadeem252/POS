// components/purchases/PurchaseDetailRow.jsx
import { Trash2 } from "lucide-react";
import FormInput from "../common/FormInput";

/**
 * A single product detail row inside a purchase order.
 */
function PurchaseDetailRow({
  detail,
  index,
  onChange,
  onRemove,
}) {
  const handleFieldChange = (field, value) => {
    onChange(index, field, value);
  };

  return (
    <div className="purchase-detail-card">
      {/* Header */}
      <div className="purchase-detail-header">
        <div className="purchase-detail-title">
          <span className="purchase-detail-index">{index + 1}</span>
          <span className="purchase-detail-name">
            {detail.productName || `Product ${index + 1}`}
          </span>
        </div>
        <button
          type="button"
          className="purchase-detail-remove"
          onClick={() => onRemove(index)}
          title="Remove product"
          aria-label="Remove product"
        >
          <Trash2 size={15} strokeWidth={2} />
        </button>
      </div>

      {/* Fields */}
      <div className="purchase-detail-fields">
        <FormInput
          label="Quantity"
          name={`quantity-${index}`}
          type="number"
          step="0.01"
          min="0"
          value={detail.quantity}
          onChange={(e) => handleFieldChange("quantity", e.target.value)}
          required
        />

        <FormInput
          label="Cost Price"
          name={`costPrice-${index}`}
          type="number"
          step="0.01"
          min="0"
          value={detail.costPrice}
          onChange={(e) => handleFieldChange("costPrice", e.target.value)}
          required
        />

        <FormInput
          label="Discount"
          name={`discount-${index}`}
          type="number"
          step="0.01"
          min="0"
          value={detail.discount}
          onChange={(e) => handleFieldChange("discount", e.target.value)}
        />

        <FormInput
          label="Tax %"
          name={`tax-${index}`}
          type="number"
          step="0.01"
          min="0"
          value={detail.tax}
          onChange={(e) => handleFieldChange("tax", e.target.value)}
          disabled
          helper="Auto from product"
        />
      </div>

      {/* Row total */}
      <div className="purchase-detail-total">
        <span className="purchase-detail-total-label">Line Total</span>
        <span className="purchase-detail-total-value">
          PKR {Number(detail.total || 0).toFixed(2)}
        </span>
      </div>
    </div>
  );
}

export default PurchaseDetailRow;