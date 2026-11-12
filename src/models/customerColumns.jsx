// models/customerColumns.jsx
export const customerBaseColumns = [
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
    { 
    key: "currentBalance", 
    label: "Khata Balance", // Renamed from Opening Balance
    className: "numeric",
    render: (row) => {
      // If the backend isn't sending currentBalance yet, default to openingBalance
      const balance = Number(row.currentBalance ?? row.openingBalance ?? 0);
      return (
        <span style={{ fontWeight: 700, color: balance > 0 ? "var(--color-danger)" : "var(--color-success)" }}>
          Rs {balance.toFixed(2)}
        </span>
      );
    }
  },
];

export const customerExtraColumns = [
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