export const getSalesReturnSearchFields = () => [
  {
    name: "returnNumber",
    label: "Return Number",
    type: "text",
    placeholder: "Search by return number...",
  },
  {
    name: "invoiceNumber",
    label: "Original Invoice",
    type: "text",
    placeholder: "Search by original invoice...",
  },
  {
    name: "customerName",
    label: "Customer / ID",
    type: "text",
    placeholder: "Search by customer...",
  },
  {
    name: "returnType",
    label: "Return Type",
    type: "select",
    options: [
      { value: "", label: "All Types" },
      { value: "return", label: "Return" },
      { value: "exchange", label: "Exchange" },
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
