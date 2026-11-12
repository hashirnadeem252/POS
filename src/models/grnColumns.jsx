// models/grnColumns.jsx

export const grnBaseColumns = [
  { 
    key: "grnNumber", 
    label: "GRN Number",
    render: (row) => row.grnNumber || "-"
  },
  { 
    key: "supplierName",    // ✅ Supplier Name only
    label: "Supplier",
    render: (row) => row.supplierName || "-"
  },
  { 
    key: "grnDate", 
    label: "GRN Date",
    render: (row) => row.grnDate ? row.grnDate.substring(0, 10) : "-"
  },
    { 
    // ✅ NEW: Show the financial impact of this GRN
    key: "total", 
    label: "Total Bill",
    className: "numeric",
    render: (row) => {
      // Sum the details
      const total = row.details?.reduce((sum, d) => sum + (Number(d.total) || 0), 0) || 0;
      return `Rs ${total.toFixed(2)}`;
    }
  },
  { 
    key: "receivedBy", 
    label: "Received By",
    render: (row) => row.receivedBy || "-"
  },
];

export const grnExtraColumns = [
  { 
    key: "comments", 
    label: "Comments",
    render: (row) => row.comments || "-"
  },
];