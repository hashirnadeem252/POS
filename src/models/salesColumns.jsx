// models/salesColumns.jsx
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
    label: "Date",
    render: (row) => row.saleDate ? new Date(row.saleDate).toLocaleDateString() : "-"
  },
  { 
    key: "total", 
    label: "Total",
    className: "numeric",
    render: (row) => `PKR ${row.total?.toFixed(2) || '0.00'}`
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
    render: (row) => `PKR ${row.paidAmount?.toFixed(2) || '0.00'}`
  },
];