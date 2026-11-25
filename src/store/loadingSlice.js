import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  requests: {},
};

const loadingSlice = createSlice({
  name: "loading",
  initialState,
  reducers: {
    startGlobalLoading(state, action) {
      const { id, message } = action.payload;
      state.requests[id] = message || "Loading data...";
    },
    stopGlobalLoading(state, action) {
      delete state.requests[action.payload];
    },
    clearGlobalLoading(state) {
      state.requests = {};
    },
  },
});

export const {
  startGlobalLoading,
  stopGlobalLoading,
  clearGlobalLoading,
} = loadingSlice.actions;

export default loadingSlice.reducer;
