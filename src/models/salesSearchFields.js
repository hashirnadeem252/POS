export const salesSearchFields = [
  {
    name: "invoiceNumber",
    label: "Invoice Number",
    placeholder: "Search by invoice...",
  },
  {
    name: "customerName",
    label: "Customer / ID",
    placeholder: "Search by customer...",
  },
  {
    name: "salesPersonName",
    label: "Sales Person",
    placeholder: "Search by sales person...",
  },
  {
    name: "status",
    label: "Status",
    type: "select",
    options: [
      { value: "", label: "All Status" },
      { value: "draft", label: "Draft" },
      { value: "completed", label: "Completed" },
      { value: "cancelled", label: "Cancelled" },
    ],
  },
  {
    name: "paymentMethod",
    label: "Payment Method",
    type: "select",
    options: [
      { value: "", label: "All Payment Methods" },
      { value: "Cash", label: "Cash" },
      { value: "Card/QR", label: "Card / QR" },
      { value: "Credit", label: "Credit" },
    ],
  },
  {
    name: "dateFrom",
    label: "From Date",
    type: "date",
  },
  {
    name: "dateTo",
    label: "To Date",
    type: "date",
  },
];

export const getSalesSearchFields = () => salesSearchFields;