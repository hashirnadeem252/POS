function formatMoney(value) {
  const amount = Number(value);
  return `PKR ${(Number.isFinite(amount) ? amount : 0).toLocaleString("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

export const salesReturnBaseColumns = [
  {
    key: "returnNumber",
    label: "Return #",
    render: (row) => row.returnNumber || "—",
  },
  {
    key: "invoiceNumber",
    label: "Original Invoice",
    render: (row) => row.invoiceNumber || "Manual return",
  },
  {
    key: "customerName",
    label: "Customer",
    render: (row) => row.customerName || "Walk-in",
  },
  {
    key: "returnDate",
    label: "Return Date & Time",
    render: (row) => formatDate(row.returnDate),
  },
  {
    key: "total",
    label: "Return Value",
    className: "numeric",
    render: (row) => formatMoney(row.total),
  },
  {
    key: "returnType",
    label: "Type",
    render: (row) => (
      <span
        className={`return-type-badge ${
          String(row.returnType || "Return").toLowerCase()
        }`}
      >
        {row.returnType || "Return"}
      </span>
    ),
  },
];

export const salesReturnExtraColumns = [
  {
    key: "manual",
    label: "Source",
    render: (row) =>
      row.isManualReturn === true || row.isManualReturn === 1
        ? "Manual"
        : "Invoice-linked",
  },
  {
    key: "returnReason",
    label: "Reason",
    render: (row) => row.returnReason || "—",
  },
  {
    key: "comments",
    label: "Comments",
    render: (row) => row.comments || "—",
  },
  {
    key: "createdBy",
    label: "Created By",
    render: (row) => row.createdBy || "—",
  },
  {
    key: "creationDate",
    label: "Recorded At",
    render: (row) => formatDate(row.creationDate),
  },
];
