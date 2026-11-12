// models/productColumns.jsx
export const productBaseColumns = [
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
    key: "category", 
    label: "Category",
    render: (row) => row.categoryName || row.category?.name || "-"
  },
  { 
    key: "brand", 
    label: "Brand",
    render: (row) => row.brandName || row.brand?.name || "-"
  },
  { 
    key: "unit", 
    label: "Unit",
    render: (row) => row.unitName || row.unit?.name || "-"
  },
  { 
    key: "costPrice", 
    label: "Cost Price",
    className: "numeric",
    render: (row) => `PKR ${row.costPrice?.toFixed(2) || '0.00'}`  // ✅ Changed to PKR
  },
  { 
    key: "retailPrice", 
    label: "Retail Price",
    className: "numeric",
    render: (row) => `PKR ${row.retailPrice?.toFixed(2) || '0.00'}`  // ✅ Changed to PKR
  },
  { 
    key: "tax", 
    label: "Tax %",
    className: "numeric",
    render: (row) => `${row.taxPercentage || 0}%`
  },
  { 
    key: "minStock", 
    label: "Min Stock",
    className: "numeric",
    render: (row) => row.minimumStock || 0
  },
  {
    key: "stockStatus",
    label: "Stock Status",
    render: (row) => {
        const stock = row.currentStock || 0;
        const minStock = row.minimumStock || 0;
        
        if (stock <= 0) {
            return <span className="stock-badge out-of-stock">🔴 Out of Stock</span>;
        } else if (stock <= minStock) {
            return <span className="stock-badge low-stock">🟡 Low Stock</span>;
        } else if (stock <= minStock * 1.5) {
            return <span className="stock-badge approaching">🟠 Approaching Low</span>;
        } else {
            return <span className="stock-badge in-stock">🟢 In Stock</span>;
        }
    }
},
];



export const productExtraColumns = [
  { 
    key: "currentStock", 
    label: "Current Stock",
    className: "numeric",
    render: (row) => row.currentStock || 0
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
