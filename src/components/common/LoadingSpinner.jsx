// components/common/LoadingSpinner.jsx
import "../../assets/styles/common/LoadingSpinner.css";

function LoadingSpinner({ 
  size = "medium", 
  color = "primary", 
  message = "",
  fullPage = false,
  overlay = false,
  card = false,  // ✅ Add card option
}) {
  const sizeMap = {
    small: "spinner-sm",
    medium: "spinner-md",
    large: "spinner-lg",
  };

  const colorMap = {
    primary: "spinner-primary",
    white: "spinner-white",
    success: "spinner-success",
    danger: "spinner-danger",
  };

  const spinnerClass = `spinner ${sizeMap[size] || sizeMap.medium} ${colorMap[color] || colorMap.primary}`;

  if (fullPage) {
    return (
      <div className="loading-spinner-fullpage">
        <div className="loading-spinner-container">
          <div className={spinnerClass}></div>
          {message && <p className="loading-message">{message}</p>}
        </div>
      </div>
    );
  }

  if (overlay) {
    return (
      <div className="loading-spinner-overlay">
        <div className="loading-spinner-container">
          <div className={spinnerClass}></div>
          {message && <p className="loading-message">{message}</p>}
        </div>
      </div>
    );
  }

  if (card) {
    return (
      <div className="loading-card">
        <div className={spinnerClass}></div>
        {message && <p className="loading-message">{message}</p>}
      </div>
    );
  }

  return (
    <div className="loading-spinner-container">
      <div className={spinnerClass}></div>
      {message && <p className="loading-message">{message}</p>}
    </div>
  );
}

export default LoadingSpinner;