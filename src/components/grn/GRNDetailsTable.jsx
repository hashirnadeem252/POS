// components/grn/GRNDetailsTable.jsx
import { ShoppingCart, Trash2, RotateCcw } from "lucide-react";
import DataTable from "../common/DataTable";
import "../../assets/styles/grn/GRNDetailsTable.css";

function GRNDetailsTable({
  details,
  activeCount,
  voidedCount,
  onDetailChange,
  onToggleVoid,
  calculateDetailTotal,
}) {
  const columns = [
    {
      key: "index",
      label: "#",
      width: "50px",
      render: (row, index) => index + 1,
    },
    {
      key: "product",
      label: "Product",
      render: (row) => {
        const isDeleted = row.rowState === "Deleted";
        return (
          <div className={`grn-product-cell ${isDeleted ? "is-void" : ""}`}>
            <span>{row.productName || `Product ID: ${row.productId}`}</span>
            {isDeleted && <span className="void-badge">VOID</span>}
          </div>
        );
      },
    },
    {
      key: "receivedQuantity",
      label: "Qty",
      className: "numeric",
      render: (row) => {
        const idx = details.findIndex((d) => d === row);
        return (
          <input
            type="number"
            step="1"
            className="input-sm"
            value={row.receivedQuantity || 0}
            onChange={(e) =>
              onDetailChange(idx, "receivedQuantity", e.target.value)
            }
            disabled={row.isVoid}
          />
        );
      },
    },
    {
      key: "costPrice",
      label: "Cost Price",
      className: "numeric",
      render: (row) => {
        const idx = details.findIndex((d) => d === row);
        return (
          <input
            type="number"
            step="0.01"
            className="input-sm"
            value={row.costPrice || 0}
            onChange={(e) =>
              onDetailChange(idx, "costPrice", e.target.value)
            }
            disabled={row.isVoid}
          />
        );
      },
    },
    {
      key: "total",
      label: "Total",
      className: "numeric",
      render: (row) => (
        <span className={`grn-row-total ${row.isVoid ? "is-void" : ""}`}>
          PKR {calculateDetailTotal(row).toFixed(2)}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      render: (row) => {
        const idx = details.findIndex((d) => d === row);
        const isDeleted = row.rowState === "Deleted";
        return (
          <button
            type="button"
            className={`btn-icon ${isDeleted ? "restore" : "void"}`}
            onClick={() => onToggleVoid(idx)}
            title={isDeleted ? "Restore item" : "Void item"}
          >
            {isDeleted ? (
              <RotateCcw size={14} strokeWidth={2} />
            ) : (
              <Trash2 size={14} strokeWidth={2} />
            )}
          </button>
        );
      },
    },
  ];

  return (
    <div className="grn-details-section">
      <div className="details-header">
        <h3>
          <ShoppingCart size={16} strokeWidth={2} />
          GRN Details ({activeCount} active)
        </h3>
        {voidedCount > 0 && (
          <span className="void-count-badge">{voidedCount} voided</span>
        )}
      </div>

      {details.length === 0 ? (
        <div className="empty-details">
          <p>No products added yet.</p>
          <p className="empty-hint">
            Search and add products above, or load from a purchase order.
          </p>
        </div>
      ) : (
        <DataTable
          data={details}
          columns={columns}
          defaultPageSize={10}
          emptyMessage="No items in GRN"
        />
      )}
    </div>
  );
}

export default GRNDetailsTable;