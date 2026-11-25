import { createSlice } from "@reduxjs/toolkit";

const routeBreadcrumbs = {
  "/dashboard": [{ label: "Dashboard" }],
  "/products": [{ label: "Product Definition" }],
  "/products/barcode": [
    { label: "Products", path: "/products" },
    { label: "Barcode Printing" },
  ],
  "/suppliers": [{ label: "Suppliers" }],
  "/customers": [{ label: "Customers" }],
  "/purchases": [{ label: "Purchase Orders" }],
  "/grn": [{ label: "GRN" }],
  "/salespersons": [{ label: "Sales Persons" }],
  "/settings": [{ label: "Store Settings" }],
  "/khata": [{ label: "Udhaar Khata" }],
  "/end-of-day": [{ label: "End of Day" }],
  "/users": [{ label: "Staff Management" }],
};

const breadcrumbSlice = createSlice({
  name: "breadcrumbs",
  initialState: { items: routeBreadcrumbs["/dashboard"] },
  reducers: {
    setBreadcrumbs(state, action) {
      state.items = action.payload;
    },
  },
});

export function getBreadcrumbsForPath(pathname) {
  return routeBreadcrumbs[pathname] || routeBreadcrumbs["/dashboard"];
}

export const { setBreadcrumbs } = breadcrumbSlice.actions;
export default breadcrumbSlice.reducer;
