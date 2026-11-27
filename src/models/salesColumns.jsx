import { formatPakistanDateTime } from "../utils/dateTime";

function formatMoney(value) {
  const amount = Number(value);
  return `PKR ${(Number.isFinite(amount) ? amount : 0).toLocaleString("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export const salesBaseColumns = [
  {
    key: "invoiceNumber",
    label: "Invoice",
    render: (row) => row.invoiceNumber || "-"
  },
  {
    key: "customerName",
    label: "Customer",
    render: (row) => row.customerName || "Walk-in"
  },
  {
    key: "salesPersonName",
    label: "Sales Person",
    render: (row) => row.salesPersonName || "-"
  },
  {
    key: "saleDate",
    label: "Date & Time",
    render: (row) => row.saleDate ? formatPakistanDateTime(row.saleDate) : "-",
  },
  {
    key: "total",
    label: "Total",
    className: "numeric",
    render: (row) => formatMoney(row.total)
  },
  {
    key: "status",
    label: "Status",
    render: (row) => (
      <span className={`status-badge ${row.status?.toLowerCase() || 'draft'}`}>
        {row.status || "Draft"}
      </span>
    )
  },
];

export const salesExtraColumns = [
  {
    key: "paymentMethod",
    label: "Payment",
    render: (row) => row.paymentMethod || "-"
  },
  {
    key: "paidAmount",
    label: "Paid",
    className: "numeric",
    render: (row) => formatMoney(row.paidAmount)
  },
  {
    key: "remainingAmount",
    label: "Balance",
    className: "numeric",
    render: (row) => formatMoney(row.remainingAmount)
  },
];