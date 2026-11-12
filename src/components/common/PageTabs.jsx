// components/common/PageTabs.jsx
import React, { useState, useEffect } from "react"; // ✅ Add React import
import { Plus } from "lucide-react";
import "../../assets/styles/common/PageTabs.css";

function PageTabs({ 
  children, 
  activeTab: controlledActiveTab, 
  onTabChange,
  tabs = [],
  onAddClick,
  addButtonLabel = "Add New",
  addButtonIcon = Plus,
  showAddButton = true,
  extraActions = null,
  extraActionsPosition = "right",
  className = "",
  headerClassName = "",
  contentClassName = "",
  flushTop = false, 
  disabled = false,
}) {
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (controlledActiveTab !== undefined) {
      setActiveTab(controlledActiveTab);
    }
  }, [controlledActiveTab]);

  const handleTabChange = (tabId) => {
    if (disabled) return;
    setActiveTab(tabId);
    if (onTabChange) {
      onTabChange(tabId);
    }
  };

  const childrenArray = Array.isArray(children) ? children : [children];
  const activeContent = childrenArray[activeTab] || null;
  const content = childrenArray.length > 0 ? activeContent : children;

  const renderIcon = (icon, size = 16) => {
    if (!icon) return null;
    
    if (typeof icon === 'function') {
      const IconComponent = icon;
      return <IconComponent size={size} strokeWidth={2} />;
    }
    
    if (typeof icon === 'string') {
      return <span className="tab-icon">{icon}</span>;
    }
    
    if (React.isValidElement(icon)) {
      return icon;
    }
    
    return null;
  };

  const renderAddButtonIcon = () => {
    if (!addButtonIcon) return null;
    
    if (typeof addButtonIcon === 'function') {
      const IconComponent = addButtonIcon;
      return <IconComponent size={16} strokeWidth={2} />;
    }
    
    if (typeof addButtonIcon === 'string') {
      return <span className="btn-icon">{addButtonIcon}</span>;
    }
    
    return null;
  };

  return (
    <div className={`tabs-container ${flushTop ? "tabs-flush-top" : ""} ${className}`}>
      <div className={`tabs-header ${headerClassName}`}>
        <div className="tabs-left">
          {tabs && tabs.length > 0 ? (
            tabs.map((tab) => (
              <button
                key={tab.id}
                className={`tab-btn ${activeTab === tab.id ? "active" : ""} ${tab.disabled ? "disabled" : ""}`}
                onClick={() => !tab.disabled && handleTabChange(tab.id)}
                disabled={tab.disabled || disabled}
                title={tab.title || ""}
              >
                {tab.icon && renderIcon(tab.icon)}
                <span className="tab-label">{tab.label}</span>
                {tab.badge && (
                  <span className="tab-badge">{tab.badge}</span>
                )}
              </button>
            ))
          ) : (
            <span className="no-tabs">No tabs available</span>
          )}
        </div>

        <div className="tabs-right">
          {extraActionsPosition === "left" && extraActions}

          {showAddButton && onAddClick && (
            <button
              className="btn-compact btn-primary"
              onClick={onAddClick}
              disabled={disabled}
            >
              {renderAddButtonIcon()}
              {addButtonLabel}
            </button>
          )}

          {extraActionsPosition === "right" && extraActions}
        </div>
      </div>

      <div className={`tab-content ${contentClassName}`}>
        {content}
      </div>
    </div>
  );
}

export default PageTabs;