import { configureStore } from "@reduxjs/toolkit";
import breadcrumbReducer from "./breadcrumbSlice";
import loadingReducer from "./loadingSlice";

export const store = configureStore({
  reducer: {
    breadcrumbs: breadcrumbReducer,
    loading: loadingReducer,
  },
});
