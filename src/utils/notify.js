// src/utils/notify.js
import toast from "react-hot-toast";

/**
 * notify — global helper for user-facing notifications.
 *
 * Usage:
 *   notify.success("Product saved");
 *   notify.error("Failed to save product");
 *   notify.warning("Please select a template first");
 *   notify.info("Processing your request...");
 *
 *   // For async operations:
 *   notify.promise(saveProduct(data), {
 *     loading: "Saving product...",
 *     success: "Product saved!",
 *     error: "Failed to save product",
 *   });
 */
export const notify = {
  // =============================
  // Simple notifications
  // =============================

  success: (message, options = {}) =>
    toast.success(message, { duration: 3000, ...options }),

  error: (message, options = {}) =>
    toast.error(message, { duration: 5000, ...options }),

  warning: (message, options = {}) =>
    toast(message, {
      icon: "⚠️",
      duration: 4000,
      style: {
        background: "#FFFBEB",
        color: "#7C2D12",
        border: "1px solid #FCD34D",
      },
      ...options,
    }),

  info: (message, options = {}) =>
    toast(message, { icon: "ℹ️", duration: 3500, ...options }),

  // =============================
  // Promise helper for async tasks
  // =============================
  promise: (promise, { loading, success, error }) =>
    toast.promise(
      promise,
      {
        loading: loading || "Processing...",
        success: success || "Done!",
        error: (err) =>
          typeof error === "function"
            ? error(err)
            : error || err?.message || "Something went wrong",
      },
      {
        success: { duration: 3000 },
        error: { duration: 5000 },
      }
    ),

  // =============================
  // Manual control
  // =============================
  dismiss: (id) => toast.dismiss(id),
  custom: (renderFn, options = {}) => toast.custom(renderFn, options),
};