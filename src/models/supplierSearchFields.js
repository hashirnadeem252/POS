// models/supplierSearchFields.js
export const supplierSearchFields = [
  {
    name: "code",
    label: "Code",
    placeholder: " Search by Code...",
    getValue: (item) => item.code,
  },
  {
    name: "name",
    label: "Supplier Name",
    placeholder: " Search by Name...",
    getValue: (item) => item.name,
  },
  {
    name: "contactPerson",
    label: "Contact Person",
    placeholder: " Search by Contact Person...",
    getValue: (item) => item.contactPerson,
  },
];

export const getSupplierSearchFields = () => {
  return supplierSearchFields;
};