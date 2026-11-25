import { useId } from "react";
import "../../assets/styles/common/Tooltip.css";

export default function Tooltip({ content, children, className = "" }) {
  const tooltipId = useId();

  if (!content) return children;

  return (
    <span className={`app-tooltip ${className}`.trim()}>
      <span className="app-tooltip-trigger" aria-describedby={tooltipId}>
        {children}
      </span>
      <span className="app-tooltip-content" id={tooltipId} role="tooltip">
        {content}
      </span>
    </span>
  );
}
