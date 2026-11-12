// components/auth/AuthButton.jsx
import { Loader2 } from "lucide-react";

export default function AuthButton({
  children,
  loading = false,
  disabled = false,
  type = "submit",
  onClick,
  variant = "primary",
  fullWidth = true,
}) {
  return (
    <button
      type={type}
      className={`auth-btn auth-btn-${variant} ${fullWidth ? "auth-btn-full" : ""}`}
      onClick={onClick}
      disabled={loading || disabled}
    >
      {loading ? (
        <>
          <Loader2 size={16} className="auth-btn-spinner" />
          Please wait...
        </>
      ) : (
        children
      )}
    </button>
  );
}