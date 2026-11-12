// models/salesSearchFields.js
export const salesSearchFields = [
  {
    name: "invoiceNumber",
    label: "Invoice Number",
    placeholder: " Search by Invoice...",
    getValue: (item) => item.invoiceNumber,
  },
  {
    name: "customerName",
    label: "Customer",
    placeholder: " Search by Customer...",
    getValue: (item) => item.customerName,
  },
  {
    name: "status",
    label: "Status",
    type: "select",
    options: [
      { value: "", label: "All Status" },
      { value: "Draft", label: "Draft" },
      { value: "Completed", label: "Completed" },
      { value: "Cancelled", label: "Cancelled" },
    ],
    getValue: (item) => item.status,
  },
];

export const getSalesSearchFields = () => salesSearchFields;