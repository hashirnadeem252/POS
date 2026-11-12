// models/salesPersonSearchFields.js
export const salesPersonSearchFields = [
  {
    name: "code",
    label: "Code",
    placeholder: " Search by Code...",
    getValue: (item) => item.code,
  },
  {
    name: "name",
    label: "Name",
    placeholder: " Search by Name...",
    getValue: (item) => item.name,
  },
  {
    name: "phone",
    label: "Phone",
    placeholder: " Search by Phone...",
    getValue: (item) => item.phone,
  },
  {
    name: "email",
    label: "Email",
    placeholder: " Search by Email...",
    getValue: (item) => item.email,
  },
];

export const getSalesPersonSearchFields = () => {
  return salesPersonSearchFields;
};