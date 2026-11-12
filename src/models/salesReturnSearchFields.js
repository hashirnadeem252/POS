// models/salesReturnSearchFields.js

export const getSalesReturnSearchFields = (sales = []) => {
  return [
    {
      key: "returnNumber",
      label: "Return Number",
      type: "text",
      placeholder: "Search by return number...",
    },
    {
      key: "saleId",
      label: "Sale ID",
      type: "select",
      placeholder: "Select Sale",
      options: [
        { value: "", label: "All Sales" },
        ...sales.map((s) => ({
          value: s.saleId,
          label: `${s.invoiceNumber || s.saleId} - PKR ${s.total || 0}`,
        })),
      ],
    },
    {
      key: "customerId",
      label: "Customer ID",
      type: "text",
      placeholder: "Search by customer ID...",
    },
    {
      key: "fromDate",
      label: "From Date",
      type: "date",
    },
    {
      key: "toDate",
      label: "To Date",
      type: "date",
    },
  ];
};