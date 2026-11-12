// components/auth/AuthInput.jsx
export default function AuthInput({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  icon: Icon,
  error,
  autoFocus = false,
  autoComplete,
  required = false,
}) {
  return (
    <div className={`auth-field ${error ? "has-error" : ""}`}>
      {label && (
        <label htmlFor={name} className="auth-label">
          {label}
          {required && <span className="auth-required">*</span>}
        </label>
      )}

      <div className="auth-input-wrapper">
        {Icon && (
          <span className="auth-input-icon">
            <Icon size={16} strokeWidth={2} />
          </span>
        )}

        <input
          id={name}
          name={name}
          type={type}
          className="auth-input"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoFocus={autoFocus}
          autoComplete={autoComplete}
        />
      </div>

      {error && <span className="auth-error">{error}</span>}
    </div>
  );
}