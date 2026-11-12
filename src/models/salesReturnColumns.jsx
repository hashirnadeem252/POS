// models/salesReturnColumns.jsx

export const salesReturnBaseColumns = [

  {
    key: "returnNumber",
    label: "Return #",
    render: (row) => row.returnNumber || "-",
  },
  {
    key: "saleId",
    label: "Sale ID",
    render: (row) => row.saleId || "-",
  },
  {
    key: "customerId",
    label: "Customer",
    render: (row) => {
      // If you have customer name mapping, add it here
      return row.customerId || "Walk-in";
    },
  },
  {
    key: "returnDate",
    label: "Return Date",
    render: (row) => {
      if (!row.returnDate) return "-";
      return new Date(row.returnDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    },
  },
  {
    key: "total",
    label: "Total",
    className: "numeric",
    render: (row) => `PKR ${Number(row.total || 0).toFixed(2)}`,
  },
  {
    key: "returnType",
    label: "Type",
    render: (row) => {
      const type = row.returnType || "Return";
      const styles = {
        Return: { background: '#f8d7da', color: '#721c24' },
        Exchange: { background: '#d4edda', color: '#155724' },
      };
      const style = styles[type] || { background: '#e2e3e5', color: '#383d41' };
      return (
        <span style={{
          padding: '2px 10px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: 600,
          ...style
        }}>
          {type}
        </span>
      );
    },
  },
  {
    key: "isManualReturn",
    label: "Manual",
    render: (row) => {
      const isManual = row.isManualReturn === true || row.isManualReturn === 1;
      return (
        <span style={{
          padding: '2px 10px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: 600,
          background: isManual ? '#fff3cd' : '#d4edda',
          color: isManual ? '#856404' : '#155724'
        }}>
          {isManual ? "Manual" : "Invoice"}
        </span>
      );
    },
  },
];

export const salesReturnExtraColumns = [
  {
    key: "comments",
    label: "Comments",
    render: (row) => row.comments || "-",
  },
  {
    key: "createdBy",
    label: "Created By",
    render: (row) => row.createdBy || "-",
  },
  {
    key: "creationDate",
    label: "Created Date",
    render: (row) => {
      if (!row.creationDate) return "-";
      return new Date(row.creationDate).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    },
  },
];