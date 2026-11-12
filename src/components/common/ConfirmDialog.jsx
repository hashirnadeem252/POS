// components/common/ConfirmDialog.jsx
import { useEffect, useRef } from "react";
import { AlertTriangle, X, Check, AlertCircle, Trash2 } from "lucide-react";
import "../../assets/styles/common/ConfirmDialog.css";

/**
 * ConfirmDialog — a professional replacement for window.confirm()
 *
 * @param {boolean}  isOpen     - Whether the dialog is visible
 * @param {Function} onClose    - Called when user cancels / closes
 * @param {Function} onConfirm  - Called when user confirms
 * @param {string}   title      - Dialog title (e.g. "Delete Product?")
 * @param {string}   message    - Body text or JSX
 * @param {string}   confirmText - Text for confirm button (default: "Confirm")
 * @param {string}   cancelText  - Text for cancel button (default: "Cancel")
 * @param {string}   variant    - "danger" | "warning" | "info" (default: "danger")
 * @param {boolean}  loading    - Show loading state on confirm button
 */
function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message = "",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  loading = false,
}) {
  const dialogRef = useRef(null);

  // Auto-focus the confirm button when dialog opens
  useEffect(() => {
    if (isOpen) {
      // Small delay so the animation completes first
      const timer = setTimeout(() => {
        const btn = dialogRef.current?.querySelector(".confirm-btn");
        if (btn) btn.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape" && isOpen && !loading) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose, loading]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // =========================
  // Variant config
  // =========================
  const variants = {
    danger: {
      Icon: AlertTriangle,
      iconClass: "variant-danger",
      confirmClass: "btn-danger",
    },
    warning: {
      Icon: AlertCircle,
      iconClass: "variant-warning",
      confirmClass: "btn-warning",
    },
    info: {
      Icon: AlertCircle,
      iconClass: "variant-info",
      confirmClass: "btn-primary",
    },
  };

  const config = variants[variant] || variants.danger;
  const IconComponent = config.Icon;

  // =========================
  // Handlers
  // =========================
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && !loading) {
      onClose();
    }
  };

  const handleConfirm = () => {
    if (!loading && onConfirm) {
      onConfirm();
    }
  };

  return (
    <div
      className="confirm-dialog-overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="confirm-dialog" ref={dialogRef}>
        {/* Close button */}
        <button
          className="confirm-close-btn"
          onClick={onClose}
          disabled={loading}
          aria-label="Close"
        >
          <X size={18} strokeWidth={2} />
        </button>

        {/* Icon */}
        <div className={`confirm-icon ${config.iconClass}`}>
          <IconComponent size={28} strokeWidth={1.75} />
        </div>

        {/* Title */}
        <h3 id="confirm-dialog-title" className="confirm-title">
          {title}
        </h3>

        {/* Message */}
        {message && <div className="confirm-message">{message}</div>}

        {/* Actions */}
        <div className="confirm-actions">
          <button
            type="button"
            className="btn btn-outline confirm-cancel-btn"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </button>

          <button
            type="button"
            className={`btn ${config.confirmClass} confirm-btn`}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="confirm-spinner" />
                Processing...
              </>
            ) : (
              <>
                {variant === "danger" && <Trash2 size={16} strokeWidth={2} />}
                {variant === "warning" && <AlertTriangle size={16} strokeWidth={2} />}
                {variant === "info" && <Check size={16} strokeWidth={2} />}
                {confirmText}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;