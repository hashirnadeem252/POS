// components/auth/PasswordInput.jsx
import { useState } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function PasswordInput({
  label,
  name,
  value,
  onChange,
  placeholder = "Enter your password",
  error,
  autoComplete = "current-password",
  required = false,
}) {
  const { t } = useTranslation();
  const [show, setShow] = useState(false);

  return (
    <div className={`auth-field ${error ? "has-error" : ""}`}>
      {label && (
        <label htmlFor={name} className="auth-label">
          {label}
          {required && <span className="auth-required">*</span>}
        </label>
      )}

      <div className="auth-input-wrapper">
        <span className="auth-input-icon">
          <Lock size={16} strokeWidth={2} />
        </span>

        <input
          id={name}
          name={name}
          type={show ? "text" : "password"}
          className="auth-input"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          dir="ltr"
        />

        <button
          type="button"
          className="auth-input-toggle"
          onClick={() => setShow((s) => !s)}
          tabIndex={-1}
          aria-label={show ? t("common.hidePassword") : t("common.showPassword")}
        >
          {show ? <EyeOff size={16} strokeWidth={2} /> : <Eye size={16} strokeWidth={2} />}
        </button>
      </div>

      {error && <span className="auth-error">{error}</span>}
    </div>
  );
}