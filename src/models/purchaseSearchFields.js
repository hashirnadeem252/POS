// models/purchaseSearchFields.js
export const purchaseSearchFields = [
  {
    name: "purchaseNumber",
    label: "Purchase Number",
    placeholder: " Search by Purchase Number...",
    getValue: (item) => item.purchaseNumber,
  },
  {
    name: "supplierId",
    label: "Supplier",
    type: "select",
    options: [], // Will be populated dynamically
    getValue: (item) => item.supplierId,
  },
  {
    name: "status",
    label: "Status",
    type: "select",
    options: [
      { value: "", label: "All Status" },
      { value: "Pending", label: "Pending" },
      { value: "Approved", label: "Approved" },
      { value: "Received", label: "Received" },
      { value: "Cancelled", label: "Cancelled" },
    ],
    getValue: (item) => item.status,
  },
  {
    name: "dateFrom",
    label: "Date From",
    type: "date",
    placeholder: "From Date",
    getValue: (item) => item.purchaseDate,
  },
  {
    name: "dateTo",
    label: "Date To",
    type: "date",
    placeholder: "To Date",
    getValue: (item) => item.purchaseDate,
  },
];

export const getPurchaseSearchFields = (suppliers = []) => {
  return purchaseSearchFields.map((field) => {
    if (field.name === "supplierId") {
      return {
        ...field,
        options: [
          { value: "", label: "All Suppliers" },
          ...suppliers.map((supplier) => ({
            value: supplier.supplierId,
            label: supplier.name || supplier.code,
          })),
        ],
      };
    }
    return field;
  });
};