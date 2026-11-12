// models/grnSearchFields.js

export const grnSearchFields = [
  {
    name: "grnNumber",
    label: "GRN Number",
    placeholder: " Search by GRN Number...",
    getValue: (item) => item.grnNumber,
  },
  {
    name: "supplierName",    // ✅ Supplier Name search
    label: "Supplier",
    placeholder: " Search by Supplier...",
    getValue: (item) => item.supplierName,
  },
];

export const getGRNSearchFields = () => {
  return grnSearchFields;
};