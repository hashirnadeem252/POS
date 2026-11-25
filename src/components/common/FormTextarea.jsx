// components/common/FormTextarea.jsx
import { forwardRef, useLayoutEffect, useRef } from "react";
import "../../assets/styles/common/FormInput.css";
import InfoIcon from "./InfoIcon";

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
    info = null,
    error = null,
    className = "",
  },
  ref
) {
  const textareaRef = useRef(null);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [value, rows]);

  const setTextareaRef = (element) => {
    textareaRef.current = element;

    if (typeof ref === "function") {
      ref(element);
    } else if (ref) {
      ref.current = element;
    }
  };

  return (
    <div className={`form-field ${className}`}>
      {label && (
        <label htmlFor={name} className="form-label">
          {label}
          {info && <InfoIcon content={info} label={`${label} information`} />}
          {required && <span className="form-required">*</span>}
        </label>
      )}

      <textarea
        ref={setTextareaRef}
        id={name}
        name={name}
        className={`form-input form-textarea ${error ? "has-error" : ""}`}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        rows={rows}
        dir="auto"
      />

      {helper && !error && <span className="form-helper">{helper}</span>}
      {error && <span className="form-error">{error}</span>}
    </div>
  );
});

export default FormTextarea;