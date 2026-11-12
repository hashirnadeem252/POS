// components/common/FormTextarea.jsx
import { forwardRef } from "react";
import "../../assets/styles/common/FormInput.css";

const FormTextarea = forwardRef(function FormTextarea(
  {
    label,
    name,
    value,
    onChange,
    placeholder,
    rows = 3,
    required = false,
    disabled = false,
    helper = null,
    error = null,
    className = "",
  },
  ref
) {
  return (
    <div className={`form-field ${className}`}>
      {label && (
        <label htmlFor={name} className="form-label">
          {label}
          {required && <span className="form-required">*</span>}
        </label>
      )}

      <textarea
        ref={ref}
        id={name}
        name={name}
        className={`form-input form-textarea ${error ? "has-error" : ""}`}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        rows={rows}
      />

      {helper && !error && <span className="form-helper">{helper}</span>}
      {error && <span className="form-error">{error}</span>}
    </div>
  );
});

export default FormTextarea;