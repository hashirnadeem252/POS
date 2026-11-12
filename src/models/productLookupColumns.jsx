// models/productLookupColumns.jsx

export const productLookupColumns = [
    { 
        key: "code", 
        label: "Code" 
    },
    { 
        key: "name", 
        label: "Product Name" 
    },
    { 
        key: "costPrice", 
        label: "Cost Price",
        className: "numeric",
        render: (item) => `PKR ${item.costPrice || 0}`
    },
    { 
        key: "retailPrice", 
        label: "Retail Price",
        className: "numeric",
        render: (item) => `PKR ${item.retailPrice || 0}`
    },
    { 
        key: "currentStock", 
        label: "In Stock",
        className: "numeric",
        render: (item) => {
            const stock = item.currentStock || 0;
            return (
                <span style={{ 
                    color: stock <= 0 ? '#dc3545' : stock < 10 ? '#ffc107' : '#28a745',
                    fontWeight: 'bold'
                }}>
                    {stock}
                </span>
            );
        }
    },
];

export const purchaseLookupColumns = [
    { 
        key: "code", 
        label: "Code" 
    },
    { 
        key: "name", 
        label: "Product Name" 
    },
    { 
        key: "costPrice", 
        label: "Cost Price",
        className: "numeric",
        render: (item) => `PKR ${item.costPrice || 0}`
    },
    { 
        key: "currentStock", 
        label: "In Stock",
        className: "numeric",
        render: (item) => {
            const stock = item.currentStock || 0;
            return (
                <span style={{ 
                    color: stock <= 0 ? '#dc3545' : stock < 10 ? '#ffc107' : '#28a745',
                    fontWeight: 'bold'
                }}>
                    {stock}
                </span>
            );
        }
    },
];

export const salesLookupColumns = [
    { 
        key: "code", 
        label: "Code" 
    },
    { 
        key: "name", 
        label: "Product Name" 
    },
    { 
        key: "retailPrice", 
        label: "Selling Price",
        className: "numeric",
        render: (item) => `PKR ${item.retailPrice || 0}`
    },
    { 
        key: "currentStock", 
        label: "Available Stock",
        className: "numeric",
        render: (item) => {
            const stock = item.currentStock || 0;
            return (
                <span style={{ 
                    color: stock <= 0 ? '#dc3545' : stock < 10 ? '#ffc107' : '#28a745',
                    fontWeight: 'bold'
                }}>
                    {stock}
                </span>
            );
        }
    },
];

export const grnLookupColumns = [
    { 
        key: "code", 
        label: "Code" 
    },
    { 
        key: "name", 
        label: "Product Name" 
    },
    { 
        key: "currentStock", 
        label: "Current Stock",
        className: "numeric",
        render: (item) => {
            const stock = item.currentStock || 0;
            return (
                <span style={{ 
                    color: stock <= 0 ? '#dc3545' : stock < 10 ? '#ffc107' : '#28a745',
                    fontWeight: 'bold'
                }}>
                    {stock}
                </span>
            );
        }
    },
];