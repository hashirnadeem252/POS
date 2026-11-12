// components/common/FormSelect.jsx
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check, Search, X } from "lucide-react";
import "../../assets/styles/common/FormSelect.css";

/**
 * FormSelect — smart dropdown with auto-flip, search, and portal rendering
 */
function FormSelect({
  label,
  name,
  value,
  onChange,
  options = [],
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  required = false,
  disabled = false,
  helper = null,
  error = null,
  searchable = true,
  emptyMessage = "No options",
  className = "",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [position, setPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
    openUp: false,
    maxHeight: 320,
  });

  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // =========================
  // Get selected label
  // =========================
  const selectedOption = useMemo(
    () => options.find((o) => String(o.value) === String(value)),
    [options, value]
  );

  // =========================
  // Filter options
  // =========================
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options;
    const term = searchTerm.toLowerCase().trim();
    return options.filter((o) =>
      String(o.label).toLowerCase().includes(term)
    );
  }, [options, searchTerm]);

  // =========================
  // Calculate dropdown position
  // =========================
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    // Space available in each direction (with 16px safety margin)
    const spaceBelow = viewportHeight - rect.bottom - 16;
    const spaceAbove = rect.top - 16;

    // Minimum height we want to show
    const MIN_HEIGHT = 180;
    const MAX_HEIGHT = 320;
    const ESTIMATED_HEIGHT = Math.min(filteredOptions.length * 40 + 60, MAX_HEIGHT);

    // Decide direction
    const openUp = spaceBelow < MIN_HEIGHT && spaceAbove > spaceBelow;

    // Available height in chosen direction
    const availableHeight = openUp ? spaceAbove : spaceBelow;
    const maxHeight = Math.min(ESTIMATED_HEIGHT, availableHeight, MAX_HEIGHT);

    // Horizontal position — align to trigger, but adjust if overflows
    let left = rect.left;
    const dropdownWidth = rect.width;
    if (left + dropdownWidth > viewportWidth - 16) {
      left = viewportWidth - dropdownWidth - 16;
    }

    setPosition({
      top: openUp ? rect.top - maxHeight - 6 : rect.bottom + 6,
      left,
      width: dropdownWidth,
      openUp,
      maxHeight,
    });
  }, [filteredOptions.length]);

  // =========================
  // Open / close handlers
  // =========================
  const openDropdown = () => {
    if (disabled) return;
    setIsOpen(true);
    // Defer position calculation until after render
    requestAnimationFrame(updatePosition);
  };

  const closeDropdown = () => {
    setIsOpen(false);
    setSearchTerm("");
    setHighlightedIndex(0);
  };

  const toggleDropdown = () => {
    if (isOpen) closeDropdown();
    else openDropdown();
  };

  // =========================
  // Re-position on scroll / resize
  // =========================
  useEffect(() => {
    if (!isOpen) return;

    const handleUpdate = () => updatePosition();

    window.addEventListener("scroll", handleUpdate, true);
    window.addEventListener("resize", handleUpdate);

    return () => {
      window.removeEventListener("scroll", handleUpdate, true);
      window.removeEventListener("resize", handleUpdate);
    };
  }, [isOpen, updatePosition]);

  // =========================
  // Close on outside click
  // =========================
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ) {
        closeDropdown();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // =========================
  // Focus search input on open
  // =========================
  useEffect(() => {
    if (isOpen && searchable) {
      setTimeout(() => searchInputRef.current?.focus(), 30);
    }
  }, [isOpen, searchable]);

  // =========================
  // Keyboard navigation
  // =========================
  const handleKeyDown = (e) => {
    if (disabled) return;

    switch (e.key) {
      case "Enter":
      case " ":
        if (!isOpen) {
          e.preventDefault();
          openDropdown();
        } else if (filteredOptions[highlightedIndex]) {
          e.preventDefault();
          selectOption(filteredOptions[highlightedIndex]);
        }
        break;

      case "Escape":
        e.preventDefault();
        closeDropdown();
        break;

      case "ArrowDown":
        e.preventDefault();
        if (!isOpen) openDropdown();
        else
          setHighlightedIndex((prev) =>
            Math.min(prev + 1, filteredOptions.length - 1)
          );
        break;

      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => Math.max(prev - 1, 0));
        break;

      default:
        break;
    }
  };

  // =========================
  // Select option
  // =========================
  const selectOption = (option) => {
    if (onChange) {
      onChange({ target: { name, value: option.value } });
    }
    closeDropdown();
  };

  const clearSelection = (e) => {
    e.stopPropagation();
    if (onChange) {
      onChange({ target: { name, value: "" } });
    }
  };

  // =========================
  // Render dropdown (via portal)
  // =========================
  const dropdownContent = isOpen ? (
    <div
      ref={dropdownRef}
      className={`custom-select-dropdown ${position.openUp ? "open-up" : ""}`}
      style={{
        position: "fixed",
        top: position.top,
        left: position.left,
        width: position.width,
        maxHeight: position.maxHeight,
        zIndex: 99999,
      }}
    >
      {searchable && (
        <div className="custom-select-search">
          <Search size={14} strokeWidth={2} />
          <input
            ref={searchInputRef}
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setHighlightedIndex(0);
            }}
            onKeyDown={handleKeyDown}
          />
          {searchTerm && (
            <button
              type="button"
              className="custom-select-search-clear"
              onClick={() => {
                setSearchTerm("");
                searchInputRef.current?.focus();
              }}
            >
              <X size={12} strokeWidth={2.5} />
            </button>
          )}
        </div>
      )}

      <div className="custom-select-options">
        {filteredOptions.length === 0 ? (
          <div className="custom-select-empty">
            {searchTerm ? `No matches for "${searchTerm}"` : emptyMessage}
          </div>
        ) : (
          filteredOptions.map((option, idx) => {
            const isSelected = String(option.value) === String(value);
            const isHighlighted = idx === highlightedIndex;
            return (
              <div
                key={option.value}
                className={`custom-select-option ${
                  isSelected ? "selected" : ""
                } ${isHighlighted ? "highlighted" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  selectOption(option);
                }}
                onMouseEnter={() => setHighlightedIndex(idx)}
              >
                <span>{option.label}</span>
                {isSelected && <Check size={14} strokeWidth={2.5} />}
              </div>
            );
          })
        )}
      </div>
    </div>
  ) : null;

  return (
    <div className={`form-field ${className}`}>
      {label && (
        <label className="form-label">
          {label}
          {required && <span className="form-required">*</span>}
        </label>
      )}

      <div
        ref={triggerRef}
        className={`custom-select ${isOpen ? "open" : ""} ${
          disabled ? "disabled" : ""
        } ${error ? "has-error" : ""}`}
        onClick={toggleDropdown}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        role="combobox"
        aria-expanded={isOpen}
      >
        <span
          className={`custom-select-value ${
            !selectedOption ? "placeholder" : ""
          }`}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>

        <div className="custom-select-icons">
          {selectedOption && !disabled && (
            <button
              type="button"
              className="custom-select-clear"
              onClick={clearSelection}
              aria-label="Clear selection"
              tabIndex={-1}
            >
              <X size={14} strokeWidth={2} />
            </button>
          )}
          <ChevronDown
            size={16}
            strokeWidth={2}
            className={`custom-select-arrow ${isOpen ? "rotated" : ""}`}
          />
        </div>
      </div>

      {helper && !error && <span className="form-helper">{helper}</span>}
      {error && <span className="form-error">{error}</span>}

      {/* Render dropdown via portal to avoid parent clipping */}
      {dropdownContent && createPortal(dropdownContent, document.body)}
    </div>
  );
}

export default FormSelect;