// models/supplierColumns.jsx
export const supplierBaseColumns = [
  { 
    key: "code", 
    label: "Code",
    render: (row) => row.code || "-"
  },
  { 
    key: "name", 
    label: "Supplier Name",
    render: (row) => row.name || "-"
  },
  { 
    key: "contactPerson", 
    label: "Contact Person",
    render: (row) => row.contactPerson || "-"
  },
  { 
    key: "phone", 
    label: "Phone",
    render: (row) => row.phone || "-"
  },
  { 
    key: "email", 
    label: "Email",
    render: (row) => row.email || "-"
  },
  { 
    key: "city", 
    label: "City",
    render: (row) => row.city || "-"
  },
  { 
    key: "openingBalance", 
    label: "Opening Balance",
    className: "numeric",
    render: (row) => `PKR ${row.openingBalance?.toFixed(2) || '0.00'}`  // ✅ Changed to PKR
  },
];

export const supplierExtraColumns = [
  { 
    key: "taxNumber", 
    label: "Tax Number",
    render: (row) => row.taxNumber || "-"
  },
  { 
    key: "status", 
    label: "Status",
    render: (row) => (
      <span className={`status-badge ${row.isActive ? 'active' : 'inactive'}`}>
        {row.isActive ? '✅ Active' : '❌ Inactive'}
      </span>
    )
  },
];