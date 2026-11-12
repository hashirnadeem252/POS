// components/common/FormInput.jsx
import { forwardRef } from "react";
import "../../assets/styles/common/FormInput.css";

/**
 * FormInput — themed text/number/email input with label & helper
 */
const FormInput = forwardRef(function FormInput(
  {
    label,
    name,
    type = "text",
    value,
    onChange,
    placeholder,
    required = false,
    disabled = false,
    helper = null,
    error = null,
    min,
    max,
    step,
    autoFocus = false,
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

      <input
        ref={ref}
        id={name}
        name={name}
        type={type}
        className={`form-input ${error ? "has-error" : ""}`}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        autoFocus={autoFocus}
      />

      {helper && !error && <span className="form-helper">{helper}</span>}
      {error && <span className="form-error">{error}</span>}
    </div>
  );
});

export default FormInput;