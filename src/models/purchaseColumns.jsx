// models/purchaseColumns.jsx
export const purchaseBaseColumns = [
  { 
    key: "purchaseNumber", 
    label: "Purchase Number",
    render: (row) => row.purchaseNumber || "-"
  },
  { 
    key: "supplierName",  
    label: "Supplier",
    render: (row) => row.supplierName || "-"
  },
  { 
    key: "purchaseDate", 
    label: "Purchase Date",
    render: (row) => row.purchaseDate ? new Date(row.purchaseDate).toLocaleDateString() : "-"
  },
  { 
    key: "status", 
    label: "Status",
    render: (row) => (
      <span className={`status-badge ${row.status?.toLowerCase() || 'pending'}`}>
        {row.status || "Pending"}
      </span>
    )
  },
  { 
    key: "total", 
    label: "Total",
    className: "numeric",
    render: (row) => `PKR ${row.total?.toFixed(2) || '0.00'}`
  },
];

export const purchaseExtraColumns = [
  { 
    key: "expectedDeliveryDate", 
    label: "Expected Delivery",
    render: (row) => row.expectedDeliveryDate ? new Date(row.expectedDeliveryDate).toLocaleDateString() : "-"
  },
  { 
    key: "comments", 
    label: "Comments",
    render: (row) => row.comments || "-"
  },
];