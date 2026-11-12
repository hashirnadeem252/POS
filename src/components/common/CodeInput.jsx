// components/common/CodeInput.jsx
import { RefreshCw } from "lucide-react";
import "../../assets/styles/common/CodeInput.css";

function CodeInput({
  label,
  name,
  value,
  onChange,
  placeholder = "Auto-generated",
  onGenerate,
  isGenerating = false,
  canGenerate = true,
  disabled = false,
  required = false,
  helper = null,
  className = "",
}) {
  return (
    <div className={`form-field ${className}`}>
      {label && (
        <label htmlFor={name} className="form-label">
          {label}
          {required && <span className="form-required">*</span>}
        </label>
      )}

      <div className="code-input-group">
        <input
          id={name}
          name={name}
          type="text"
          className="form-input code-input-field"
          value={value}
          onChange={onChange}
          placeholder={isGenerating ? "Generating..." : placeholder}
          disabled={disabled}
          required={required}
        />

        {onGenerate && (
          <button
            type="button"
            className="code-input-generate-btn"
            onClick={onGenerate}
            disabled={!canGenerate || isGenerating || disabled}
            title={isGenerating ? "Generating..." : "Generate code"}
          >
            <RefreshCw
              size={16}
              strokeWidth={2}
              className={isGenerating ? "spinning" : ""}
            />
          </button>
        )}
      </div>

      {helper && <span className="form-helper">{helper}</span>}
    </div>
  );
}

export default CodeInput;