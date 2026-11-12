// components/common/MasterDataDropdown.jsx
import { useState, useRef, useEffect } from "react";
import {
  Settings,
  ChevronDown,
  FolderOpen,
  Tag,
  Ruler,
  Plus,
} from "lucide-react";
import "../../assets/styles/common/MasterDataDropdown.css";

/**
 * MasterDataDropdown Component
 * Dropdown for managing master data (categories, brands, units)
 */
function MasterDataDropdown({ items, onItemClick, buttonLabel = "⚙️ Manage" }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /**
   * Toggle dropdown
   */
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  /**
   * Handle item click
   */
  const handleItemClick = (item) => {
    if (onItemClick) {
      onItemClick(item);
    }
    setIsOpen(false);
  };

  /**
   * Get icon for item
   */
  const getItemIcon = (key) => {
    switch (key) {
      case "category":
        return <FolderOpen size={16} strokeWidth={1.75} />;
      case "brand":
        return <Tag size={16} strokeWidth={1.75} />;
      case "unit":
        return <Ruler size={16} strokeWidth={1.75} />;
      default:
        return <Plus size={16} strokeWidth={1.75} />;
    }
  };

  return (
    <div className="master-dropdown-container" ref={dropdownRef}>
      <button
        className="master-toggle-btn"
        onClick={toggleDropdown}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Settings size={16} strokeWidth={1.75} />
        Manage
        <ChevronDown
          size={14}
          strokeWidth={2}
          className={`dropdown-arrow ${isOpen ? "open" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="master-dropdown-menu">
          {items.map((item, index) => (
            <div key={index}>
              <button
                className="master-dropdown-item"
                onClick={() => handleItemClick(item)}
              >
                <span className="item-icon">{getItemIcon(item.key)}</span>
                <div className="item-content">
                  <span className="item-title">{item.title}</span>
                  {item.description && (
                    <span className="item-description">{item.description}</span>
                  )}
                </div>
                <Plus size={14} strokeWidth={2} className="item-add-icon" />
              </button>
              {item.divider && <div className="dropdown-divider" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MasterDataDropdown;