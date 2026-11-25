
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Store, CreditCard } from "lucide-react";

import { useAuth } from "../hooks/auth/useAuth";
import StoreSettings from "./settings/StoreSettings";
import SubscriptionBilling from "./settings/SubscriptionBilling";

import "../assets/styles/settings/Settings.css";

export default function Settings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  // Case-insensitive Admin role check
  const isAdmin = user?.role?.toLowerCase() === "admin";

  // Read active tab from URL
  const activeTab = searchParams.get("tab") || "store";

  // Redirect non-admin users away from subscription settings
  useEffect(() => {
    if (activeTab === "subscription" && !isAdmin) {
      setSearchParams({ tab: "store" }, { replace: true });
    }
  }, [activeTab, isAdmin, setSearchParams]);

  // Available settings tabs
  const tabs = [
    {
      id: "store",
      label: "Store Settings",
      icon: Store,
      visible: true,
    },
    {
      id: "subscription",
      label: "Subscription & Billing",
      icon: CreditCard,
      visible: isAdmin,
    },
  ];

  // Change active tab
  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  return (
    <div className="settings-page">
      {/* Settings Navigation */}
      <div className="settings-tabs">
        {tabs
          .filter((tab) => tab.visible)
          .map((tab) => {
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                type="button"
                className={`settings-tab ${
                  activeTab === tab.id ? "active" : ""
                }`}
                onClick={() => handleTabChange(tab.id)}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </button>
            );
          })}
      </div>

      {/* Settings Content */}
      <div className="settings-tab-content">
        {activeTab === "store" && <StoreSettings />}

        {activeTab === "subscription" && isAdmin && (
          <SubscriptionBilling />
        )}
      </div>
    </div>
  );
}
