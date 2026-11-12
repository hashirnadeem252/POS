// components/grn/GRNPurchasePicker.jsx
import { FileText, Loader2 } from "lucide-react";
import FormSelect from "../common/FormSelect";

function GRNPurchasePicker({
  supplierPurchases,
  selectedPurchase,
  loadingPurchase,
  onPurchaseSelect,
}) {
  const poOptions = supplierPurchases.map((p) => ({
    value: p.purchaseId,
    label: `${p.purchaseNumber} — ${new Date(p.purchaseDate).toLocaleDateString()}`,
  }));

  return (
    <div className="grn-picker-section">
      <p className="mode-description">
        Select a purchase order to load items automatically.
      </p>

      {supplierPurchases.length === 0 ? (
        <div className="no-purchases-message">
          <FileText size={24} strokeWidth={1.75} />
          <p>No pending purchase orders for this supplier.</p>
        </div>
      ) : (
        <FormSelect
          label="Select Purchase Order"
          name="purchaseId"
          value={selectedPurchase?.purchaseId || ""}
          onChange={onPurchaseSelect}
          options={poOptions}
          placeholder="Choose a purchase order"
          searchPlaceholder="Search by PO number..."
          disabled={loadingPurchase}
          helper={
            loadingPurchase ? (
              <>
                <Loader2 size={12} className="spinning" /> Loading purchase details...
              </>
            ) : null
          }
        />
      )}

      {selectedPurchase && (
        <div className="purchase-info">
          <div className="purchase-info-grid">
            <div>
              <strong>PO Number:</strong> {selectedPurchase.purchaseNumber}
            </div>
            <div>
              <strong>Date:</strong>{" "}
              {selectedPurchase.purchaseDate
                ? new Date(selectedPurchase.purchaseDate).toLocaleDateString()
                : "-"}
            </div>
            <div>
              <strong>Items:</strong> {selectedPurchase.details?.length || 0}
            </div>
            <div>
              <strong>Total:</strong> PKR{" "}
              {selectedPurchase.total?.toFixed(2) || "0.00"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GRNPurchasePicker;