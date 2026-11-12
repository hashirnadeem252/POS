// models/exportConfigs.js

export const productExportConfig = {
  title: '📦 Products List',
  subtitle: 'Generated from POS System',
  filename: 'products',
  headers: [
    "Code", "Name", "Category", "Brand", "Unit",
    "Cost Price", "Retail Price", "Tax %", "Minimum Stock",
    "Current Stock", "Status"
  ],
  rowMapper: (p) => [
    p.code || "",
    p.name || "",
    p.categoryName || "",
    p.brandName || "",
    p.unitName || "",
    p.costPrice || 0,
    p.retailPrice || 0,
    p.taxPercentage || 0,
    p.minimumStock || 0,
    p.currentStock || 0,
   p.isActive ? "Yes" : "No"
  ],
};

export const supplierExportConfig = {
  title: '📋 Suppliers List',
  subtitle: 'Generated from POS System',
  filename: 'suppliers',
  headers: [
    "Code", "Name", "Contact Person", "Phone", "Email", 
    "City", "Opening Balance", "Tax Number", "Status"
  ],
  rowMapper: (s) => [
    s.code || "",
    s.name || "",
    s.contactPerson || "",
    s.phone || "",
    s.email || "",
    s.city || "",
    s.openingBalance || 0,
    s.taxNumber || "",
   s.isActive ? "Yes" : "No" 
  ],
};

export const customerExportConfig = {
  title: '👥 Customers List',
  subtitle: 'Generated from POS System',
  filename: 'customers',
  headers: [
    "Customer ID", "Code", "Name", "Phone", "Email", 
    "City", "Opening Balance", "Active"
  ],
  rowMapper: (c) => [
    c.customerId || "",
    c.code || "",
    c.name || "",
    c.phone || "",
    c.email || "",
    c.city || "",
    c.openingBalance || 0,
    c.isActive ? "Yes" : "No"
  ],
};

export const purchaseExportConfig = {
  title: '📦 Purchase Orders List',
  subtitle: 'Generated from POS System',
  filename: 'purchases',
  headers: [
    "Purchase ID", "Purchase Number", "Supplier ID", 
    "Purchase Date", "Status", "Total", "Comments"
  ],
  rowMapper: (p) => [
    p.purchaseId || "",
    p.purchaseNumber || "",
    p.supplierId || "",
    p.purchaseDate ? new Date(p.purchaseDate).toLocaleDateString() : "",
    p.status || "Pending",
    p.total || 0,
    p.comments || "",
  ],
};

export const salesPersonExportConfig = {
  title: '👤 Sales Persons List',
  subtitle: 'Generated from POS System',
  filename: 'salespersons',
  headers: [
    "ID", "Code", "Name", "Phone", "Email", 
    "Commission %", "Active"
  ],
  rowMapper: (s) => [
    s.salesPersonId || "",
    s.code || "",
    s.name || "",
    s.phone || "",
    s.email || "",
    s.commissionPercentage || 0,
    s.isActive ? "Yes" : "No"
  ],
};

export const grnExportConfig = {
  title: '📦 GRN List',
  subtitle: 'Generated from POS System',
  filename: 'grns',
  headers: [
    "GRN ID", "GRN Number", "Purchase ID", "Supplier ID", 
    "GRN Date", "Received By", "Comments"
  ],
  rowMapper: (g) => [
    g.grnId || "",
    g.grnNumber || "",
    g.purchaseId || "",
    g.supplierId || "",
    g.grnDate ? g.grnDate.substring(0, 10) : "",
    g.receivedBy || "",
    g.comments || "",
  ],
};

export const salesExportConfig = {
  title: '📋 Sales List',
  subtitle: 'Generated from POS System',
  filename: 'sales',
  headers: [
    "Invoice Number", "Customer", "Sales Person",
    "Date", "Total", "Status", "Payment Method"
  ],
  rowMapper: (s) => [
    s.invoiceNumber || "",
    s.customerName || "Walk-in",
    s.salesPersonName || "-",
    s.saleDate ? new Date(s.saleDate).toLocaleDateString() : "",
    s.total || 0,
    s.status || "Draft",
    s.paymentMethod || "-",
  ],
};

// ✅ ADD THIS - Sales Returns Export Config
export const salesReturnExportConfig = {
  title: '🔄 Sales Returns List',
  subtitle: 'Generated from POS System',
  filename: 'sales-returns',
  headers: [
    "Return ID", "Return Number", "Sale ID", "Customer ID",
    "Return Date", "Total", "Type", "Manual", "Comments"
  ],
  rowMapper: (r) => [
    r.salesReturnId || "",
    r.returnNumber || "",
    r.saleId || "",
    r.customerId || "Walk-in",
    r.returnDate ? new Date(r.returnDate).toLocaleDateString() : "",
    r.total || 0,
    r.returnType || "Return",
    r.isManualReturn ? "Manual" : "Invoice",
    r.comments || "",
  ],
};