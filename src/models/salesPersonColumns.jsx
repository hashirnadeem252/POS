// models/salesPersonColumns.jsx
export const salesPersonBaseColumns = [

  { 
    key: "code", 
    label: "Code",
    render: (row) => row.code || "-"
  },
  { 
    key: "name", 
    label: "Name",
    render: (row) => row.name || "-"
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
    key: "commissionPercentage", 
    label: "Commission %",
    className: "numeric",
    render: (row) => `${row.commissionPercentage || 0}%`
  },
];

export const salesPersonExtraColumns = [
  { 
    key: "isActive", 
    label: "Active",
    render: (row) => (
      <span className={`status-badge ${row.isActive ? 'active' : 'inactive'}`}>
        {row.isActive ? '✅ Yes' : '❌ No'}
      </span>
    )
  },
];