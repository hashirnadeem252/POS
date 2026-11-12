// components/common/MasterDataModal.jsx
import { useState, useEffect, useRef } from "react";
import {
  FolderOpen,
  Tag,
  Ruler,
  X,
  Save,
  Loader2,
} from "lucide-react";
import { notify } from "../../utils/notify";
import "../../assets/styles/common/MasterDataModal.css";

/**
 * MasterDataModal Component
 * A reusable modal for adding master data (categories, brands, units)
 *
 * @param {string} type - Type of master data: "category" | "brand" | "unit"
 * @param {function} onClose - Callback when modal is closed
 * @param {function} onSave - Callback with form data when saved
 */
function MasterDataModal({ type, onClose, onSave }) {
  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [loading, setLoading] = useState(false);
  const modalRef = useRef(null);

  /**
   * Get configuration based on type
   */
  const getConfig = () => {
    const configs = {
      category: {
        title: "Add New Category",
        Icon: FolderOpen,
        placeholder: "Enter category name...",
        helper: "e.g., Electronics, Clothing, Food",
        color: "var(--color-primary)",
      },
      brand: {
        title: "Add New Brand",
        Icon: Tag,
        placeholder: "Enter brand name...",
        helper: "e.g., Samsung, Nike, Sony",
        color: "var(--color-secondary)",
      },
      unit: {
        title: "Add New Unit",
        Icon: Ruler,
        placeholder: "Enter unit name...",
        helper: "e.g., Piece, Kilogram, Liter",
        color: "var(--color-success)",
      },
    };
    return configs[type] || configs.category;
  };

  const config = getConfig();
  const { Icon } = config;

  // Auto-focus first input when modal opens
  useEffect(() => {
    const timer = setTimeout(() => {
      const input = modalRef.current?.querySelector('input[type="text"]');
      if (input) input.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose, loading]);

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      notify.warning("Name is required");
      return;
    }

    setLoading(true);
    try {
      const data = { name: name.trim() };
      if (type === "unit" && shortName.trim()) {
        data.shortName = shortName.trim();
      }

      await onSave(data);
      setName("");
      setShortName("");
      onClose();
    } catch (error) {
      console.error("Error saving:", error);
      notify.error("Failed to save. Please try again");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Close modal when clicking the overlay
   */
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && !loading) {
      onClose();
    }
  };

  return (
    <div
      className="master-modal-overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="master-modal" ref={modalRef}>
        {/* ===== Header ===== */}
        <div className="master-modal-header">
          <div className="modal-title-wrapper">
            <span
              className="modal-icon"
              style={{ background: `${config.color}20`, color: config.color }}
            >
              <Icon size={20} strokeWidth={1.75} />
            </span>
            <h3 id="modal-title">{config.title}</h3>
          </div>
          <button
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
            disabled={loading}
          >
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        {/* ===== Body ===== */}
        <form onSubmit={handleSubmit} className="master-modal-body">
          {/* Name field */}
          <div className="form-group">
            <label htmlFor="master-name">
              Name <span className="required">*</span>
            </label>
            <input
              id="master-name"
              type="text"
              className="input"
              placeholder={config.placeholder}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              disabled={loading}
            />
            <span className="helper-text">{config.helper}</span>
          </div>

          {/* Short name field (units only) */}
          {type === "unit" && (
            <div className="form-group">
              <label htmlFor="master-short-name">Symbol / Short Name</label>
              <input
                id="master-short-name"
                type="text"
                className="input"
                placeholder="e.g., pc, kg, L"
                value={shortName}
                onChange={(e) => setShortName(e.target.value)}
                disabled={loading}
              />
              <span className="helper-text">
                Optional short form (e.g., pc for Piece, kg for Kilogram)
              </span>
            </div>
          )}

          {/* ===== Actions ===== */}
          <div className="master-modal-actions">
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="spinning" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} strokeWidth={2} />
                  Save
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MasterDataModal;