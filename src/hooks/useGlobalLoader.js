import { useCallback } from "react";
import { useDispatch } from "react-redux";
import {
  startGlobalLoading,
  stopGlobalLoading,
} from "../store/loadingSlice";

let requestSequence = 0;

export function useGlobalLoader() {
  const dispatch = useDispatch();

  return useCallback(
    async (operation, message = "Loading data...") => {
      if (typeof operation !== "function") {
        throw new TypeError("Global loading requires an async operation.");
      }

      const id = `loading-${Date.now()}-${++requestSequence}`;
      dispatch(startGlobalLoading({ id, message }));

      try {
        return await operation();
      } finally {
        dispatch(stopGlobalLoading(id));
      }
    },
    [dispatch]
  );
}
