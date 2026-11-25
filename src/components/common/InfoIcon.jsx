import { Info } from "lucide-react";
import Tooltip from "./Tooltip";

export default function InfoIcon({ content, label = "More information" }) {
  return (
    <Tooltip content={content} className="app-info-tooltip">
      <span className="app-info-icon" tabIndex={0} aria-label={label}>
        <Info size={15} strokeWidth={2} aria-hidden="true" />
      </span>
    </Tooltip>
  );
}
