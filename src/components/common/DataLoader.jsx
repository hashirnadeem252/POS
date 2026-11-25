import { useSelector } from "react-redux";
import "../../assets/styles/common/LoadingSpinner.css";

export function DataLoader({
  size = "medium",
  message = "",
  fullPage = false,
  overlay = false,
  card = false,
  className = "",
}) {
  const sizeClass =
    size === "small" ? "data-loader-spinner-sm" : size === "large"
      ? "data-loader-spinner-lg"
      : "data-loader-spinner-md";

  const containerClass = fullPage
    ? "data-loader-fullpage"
    : overlay
      ? "data-loader-overlay"
      : card
        ? "data-loader-card"
        : "data-loader-inline";

  return (
    <div
      className={`${containerClass} ${className}`.trim()}
      role="status"
      aria-live="polite"
    >
      <span className={`data-loader-spinner ${sizeClass}`} aria-hidden="true" />
      {message && <span className="data-loader-message">{message}</span>}
    </div>
  );
}

export function GlobalDataLoader() {
  const requests = useSelector((state) => state.loading.requests);
  const messages = Object.values(requests || {});

  if (messages.length === 0) return null;

  return (
    <DataLoader
      fullPage
      size="large"
      message={messages[0]}
      className="data-loader-global"
    />
  );
}

export default DataLoader;
