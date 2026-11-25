export const productImportFields = [
  { key: "name", header: "Name", label: "Product name", required: true },
  {
    key: "code",
    header: "Code",
    label: "Product code",
    required: true,
    unique: true,
  },
  {
    key: "barcode",
    header: "Barcode",
    label: "Barcode",
    unique: true,
  },
  { key: "categoryName", header: "CategoryName", label: "Category name" },
  { key: "brandName", header: "BrandName", label: "Brand name" },
  { key: "unitName", header: "UnitName", label: "Unit name" },
  {
    key: "retailPrice",
    header: "RetailPrice",
    label: "Retail price",
    required: true,
    type: "number",
  },
  {
    key: "costPrice",
    header: "CostPrice",
    label: "Cost price",
    required: true,
    type: "number",
  },
  {
    key: "minimumStock",
    header: "MinimumStock",
    label: "Minimum stock",
    type: "number",
    defaultValue: "0",
  },
    {
    key: "openingStock",
    header: "OpeningStock",
    label: "Opening stock",
    type: "number",
    defaultValue: "0",
  },
];

export const customerImportFields = [
  { key: "code", header: "Code", label: "Customer code", required: true, unique: true },
  { key: "name", header: "Name", label: "Customer name", required: true },
  { key: "phone", header: "Phone", label: "Phone" },
  { key: "email", header: "Email", label: "Email", type: "email" },
  { key: "address", header: "Address", label: "Address" },
  { key: "city", header: "City", label: "City" },
  { key: "taxNumber", header: "TaxNumber", label: "Tax number" },
];

export const supplierImportFields = [
  { key: "code", header: "Code", label: "Supplier code", required: true, unique: true },
  { key: "name", header: "Name", label: "Supplier name", required: true },
  { key: "contactPerson", header: "ContactPerson", label: "Contact person" },
  { key: "phone", header: "Phone", label: "Phone" },
  { key: "email", header: "Email", label: "Email", type: "email" },
  { key: "address", header: "Address", label: "Address" },
  { key: "city", header: "City", label: "City" },
  { key: "taxNumber", header: "TaxNumber", label: "Tax number" },
];
