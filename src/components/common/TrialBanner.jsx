import { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, ArrowRight, ShieldAlert, Clock, X } from "lucide-react";
import { AuthContext } from "../../contexts/AuthContext";
import "../../assets/styles/common/TrialBanner.css";

export default function TrialBanner() {
  const { subscription, user, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isDismissed, setIsDismissed] = useState(false);

  const tenantId = user?.tenantId ?? user?.userId ?? user?.id;
  const end = subscription?.trialEndDate ? new Date(subscription.trialEndDate) : new Date();
  const today = new Date();
  const daysLeft = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const urgencyLevel = daysLeft <= 3 ? "urgent" : daysLeft <= 7 ? "warning" : "normal";
  const dismissalKey = tenantId ? `trial_banner_dismissed_${tenantId}_${urgencyLevel}` : null;

  useEffect(() => {
    if (!dismissalKey) return;
    setIsDismissed(localStorage.getItem(dismissalKey) === "true");
  }, [dismissalKey]);

  if (loading || !user || user.role?.toLowerCase() !== "admin") {
    return null;
  }

  // ✅ Show banner for both "Trial" and "Expired" statuses
  const statusLower = subscription?.status?.toLowerCase();
  if (!subscription || (statusLower !== "trial" && statusLower !== "expired")) {
    return null;
  }

  // ✅ Use backend's IsExpired OR local daysLeft check
  const isExpired = subscription.isExpired === true || daysLeft <= 0;

  const handleDismiss = () => {
    if (!dismissalKey) return;
    localStorage.setItem(dismissalKey, "true");
    setIsDismissed(true);
  };

  if (isExpired) {
    return (
      <div className="trial-banner trial-banner-expired">
        <div className="trial-banner-content">
          <div className="trial-banner-icon"><ShieldAlert size={20} /></div>
          <div className="trial-banner-text">
            <h4>Your Trial Has Expired</h4>
            <p>Your free trial has ended. Upgrade now to restore access to your POS operations.</p>
          </div>
        </div>
        <button className="trial-banner-btn btn-expired" onClick={() => navigate("/settings?tab=subscription")}>
          Upgrade Now <ArrowRight size={16} />
        </button>
      </div>
    );
  }

  if (isDismissed) {
    return null;
  }

  let variantClass = "trial-banner-normal";
  let headline = "You are currently on a Free Trial";
  let subtext = `Your trial ends on ${end.toLocaleDateString("en-PK", { month: "short", day: "numeric", year: "numeric" })}.`;
  let Icon = Sparkles;

  if (daysLeft <= 3) {
    variantClass = "trial-banner-urgent";
    headline = `Only ${daysLeft} days left!`;
    subtext = "Your trial expires soon. Upgrade now to keep your business running smoothly.";
    Icon = Clock;
  } else if (daysLeft <= 7) {
    variantClass = "trial-banner-warning";
    headline = `${daysLeft} days remaining`;
    subtext = "We recommend upgrading soon to ensure uninterrupted access to your POS.";
    Icon = Clock;
  }

  return (
    <div className={`trial-banner ${variantClass}`}>
      <div className="trial-banner-content">
        <div className="trial-banner-icon"><Icon size={20} strokeWidth={2} /></div>
        <div className="trial-banner-text">
          <h4>{headline}</h4>
          <p>{subtext}</p>
        </div>
      </div>
      <div className="trial-banner-actions">
        <button type="button" className="trial-banner-dismiss" onClick={handleDismiss} aria-label="Dismiss trial banner" title="Dismiss">
          <X size={17} /> <span>Dismiss</span>
        </button>
        <button type="button" className="trial-banner-btn" onClick={() => navigate("/settings?tab=subscription")}>
          Upgrade Plan <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}