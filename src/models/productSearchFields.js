// models/productSearchFields.js
export const productSearchFields = [
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
    name: "categoryId",
    label: "Categories",
    type: "select",
    options: [],
    getValue: (item) => item.categoryId,
  },
  {
    name: "brandId",
    label: "Brands",
    type: "select",
    options: [],
    getValue: (item) => item.brandId,
  },
];

export const getSearchFields = (categories = [], brands = []) => {
  return productSearchFields.map((field) => {
    if (field.name === "categoryId") {
      return {
        ...field,
        options: categories.map((cat) => ({
          value: cat.categoryId,
          label: cat.name,
        })),
      };
    }
    if (field.name === "brandId") {
      return {
        ...field,
        options: brands.map((brand) => ({
          value: brand.brandId,
          label: brand.name,
        })),
      };
    }
    return field;
  });
};