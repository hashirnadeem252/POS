import React from "react";
import { PackageOpen } from "lucide-react";

/**
 * Premium Empty State Component
 * 
 * @param {ReactNode} icon - The lucide icon to display (defaults to PackageOpen)
 * @param {string} title - The main heading (e.g., "No products found")
 * @param {string} description - The supporting text (e.g., "Get started by adding your first product.")
 * @param {ReactNode} action - Optional button to show (e.g., <button>Add Product</button>)
 */
export default function EmptyState({ 
    icon, 
    title, 
    description, 
    action,
    compact = false,
    className = ""
}) {
    return (
        <div className={`empty-state-container${compact ? " empty-state-container--compact" : ""}${className ? ` ${className}` : ""}`}>
            <div className="empty-state-content">
                {/* Icon Circle */}
                <div className="empty-state-icon-wrapper">
                    {icon || <PackageOpen size={40} strokeWidth={1.5} />}
                </div>

                {/* Text */}
                <h3 className="empty-state-title">{title}</h3>
                {description && (
                    <p className="empty-state-description">{description}</p>
                )}

                {/* Action Button */}
                {action && (
                    <div className="empty-state-action">
                        {action}
                    </div>
                )}
            </div>
        </div>
    );
}