
import { useState, useEffect, useRef, useCallback, useContext } from "react";
import {
  Bell,
  RefreshCw,
  CheckCircle,
  CheckCheck,
  AlertTriangle,
  AlertCircle,
  ChevronRight,
  Clock,
  Wallet,
  TrendingUp,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext";
import { getSales } from "../../services/SaleDefinition/saleService";
import { api } from "../../services/apiClient";
import { getProductsFromIndexedDB } from "../../services/indexdb/productService";
import { PRODUCTS_UPDATED_EVENT } from "../../services/ProductDefinition/productService";
import { MASTER_DATA_UPDATED_EVENT } from "../../services/masterDataSyncService";
import { getCurrentAuthTenantId } from "../../utils/authTenant";
import { getPakistanDateString } from "../../utils/dateTime";
import EmptyState from "./EmptyState";
import "../../assets/styles/common/NotificationDropdown.css";

const READ_ALERTS_KEY = "saleKhata_read_notification_alerts";

// =========================================
// STORED READ ALERTS
// =========================================

function getStoredReadAlerts() {
  try {
    const stored = window.localStorage.getItem(READ_ALERTS_KEY);
    const parsed = stored ? JSON.parse(stored) : [];

    return Array.isArray(parsed)
      ? parsed.filter((key) => typeof key === "string")
      : [];
  } catch (error) {
    console.error("Could not read notification read state:", error);
    return [];
  }
}

function NotificationDropdown() {
  const { user, subscription } = useContext(AuthContext);

  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [readAlertKeys, setReadAlertKeys] = useState(getStoredReadAlerts);

  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const isAdmin = user?.role?.toLowerCase() === "admin";

  const tenantId = user?.tenantId ?? user?.TenantId;

  const [alerts, setAlerts] = useState({
    lowStock: [],
    heldSales: [],
    udhaar: [],
    todaySales: 0,
  });

  // =========================================
  // CHECK SALES AND UDHAR ALERTS
  // =========================================

  const checkAllAlerts = useCallback(async () => {
    if (!navigator.onLine) return;

    try {
      setLoading(true);

      const [salesRes, khataRes] = await Promise.all([
        getSales(),
        api.get("/api/Customers/balances").catch(() => []),
      ]);

      const allSales = salesRes || [];

      const heldSales = allSales.filter(
        (sale) => sale.status?.toLowerCase() === "draft"
      );

      const pendingUdhaar = (khataRes || []).filter(
        (customer) => Number(customer.currentBalance) > 0
      );

      const todayStr = getPakistanDateString(new Date());

      const todaysTotal = allSales
        .filter(
          (sale) =>
            getPakistanDateString(sale.saleDate) === todayStr &&
            sale.status?.toLowerCase() === "completed"
        )
        .reduce((sum, sale) => sum + Number(sale.total), 0);

      setAlerts((current) => ({
        ...current,
        heldSales,
        udhaar: pendingUdhaar,
        todaySales: todaysTotal,
      }));
    } catch (error) {
      console.error("Error checking alerts:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // =========================================
  // INITIAL AND PERIODIC ALERT REFRESH
  // =========================================

  useEffect(() => {
    const initialCheck = window.setTimeout(() => {
      if (navigator.onLine) {
        checkAllAlerts();
      }
    }, 0);

    const interval = setInterval(() => {
      if (
        navigator.onLine &&
        document.visibilityState === "visible"
      ) {
        checkAllAlerts();
      }
    }, 5 * 60 * 1000);

    const handleOnline = () => {
      if (document.visibilityState === "visible") {
        checkAllAlerts();
      }
    };

    window.addEventListener("online", handleOnline);

    return () => {
      window.clearTimeout(initialCheck);
      clearInterval(interval);
      window.removeEventListener("online", handleOnline);
    };
  }, [checkAllAlerts]);

  // =========================================
  // LOW STOCK ALERTS
  // =========================================

  useEffect(() => {
    let active = true;
    let receivedLiveUpdate = false;

    const updateLowStock = (products = []) => {
      const lowStock = products.filter((product) => {
        const stock = Number(product.currentStock);
        const minimumStock = Number(product.minimumStock);

        return (
          Number.isFinite(stock) &&
          Number.isFinite(minimumStock) &&
          stock <= minimumStock
        );
      });

      setAlerts((current) => ({
        ...current,
        lowStock,
      }));
    };

    getProductsFromIndexedDB(getCurrentAuthTenantId())
      .then((products) => {
        if (active && !receivedLiveUpdate) {
          updateLowStock(products);
        }
      })
      .catch((error) => {
        console.error(
          "Failed to load cached inventory alerts:",
          error
        );
      });

    const handleProductsUpdated = (event) => {
      if (event.detail?.tenantId !== getCurrentAuthTenantId()) {
        return;
      }

      receivedLiveUpdate = true;
      updateLowStock(event.detail?.products || []);
    };

    const handleMasterDataUpdated = (event) => {
      if (
        event.detail?.tenantId === getCurrentAuthTenantId() &&
        event.detail?.entity === "products"
      ) {
        receivedLiveUpdate = true;
        updateLowStock(event.detail.records || []);
      }
    };

    window.addEventListener(
      PRODUCTS_UPDATED_EVENT,
      handleProductsUpdated
    );

    window.addEventListener(
      MASTER_DATA_UPDATED_EVENT,
      handleMasterDataUpdated
    );

    return () => {
      active = false;

      window.removeEventListener(
        PRODUCTS_UPDATED_EVENT,
        handleProductsUpdated
      );

      window.removeEventListener(
        MASTER_DATA_UPDATED_EVENT,
        handleMasterDataUpdated
      );
    };
  }, []);

  // =========================================
  // CLOSE DROPDOWN ON OUTSIDE CLICK
  // =========================================

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  // =========================================
  // SUBSCRIPTION ALERT - FROM AUTH CONTEXT
  // =========================================

  let subscriptionAlert = null;

  if (isAdmin && subscription) {
    const status = subscription.status?.toLowerCase();

    const trialEnd = subscription.trialEndDate
      ? new Date(subscription.trialEndDate)
      : null;

    const daysLeft = trialEnd
      ? Math.ceil(
          (trialEnd.getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        )
      : null;

    if (
      status === "expired" ||
      (status === "trial" &&
        daysLeft !== null &&
        daysLeft <= 0)
    ) {
      subscriptionAlert = {
        key: `subscription:${tenantId}:expired`,
        title: "Free Trial Expired",
        message:
          "Your free trial has expired. Upgrade your subscription to continue.",
        type: "danger",
      };
    } else if (
      status === "trial" &&
      daysLeft !== null &&
      daysLeft <= 7
    ) {
      const milestone =
        daysLeft <= 1 ? 1 : daysLeft <= 3 ? 3 : 7;

      subscriptionAlert = {
        key: `subscription:${tenantId}:trial:${milestone}`,
        title: "Free Trial Reminder",
        message: `Your free trial expires in ${daysLeft} day${
          daysLeft === 1 ? "" : "s"
        }.`,
        type: "warning",
      };
    }
  }

  // =========================================
  // ACTIVE ALERT KEYS
  // =========================================

  const activeAlertKeys = [
    ...alerts.lowStock.map(
      (product) =>
        `stock:${product.productId}:${Number(product.currentStock) || 0}:${Number(product.minimumStock) || 0}`
    ),

    ...alerts.heldSales.map(
      (sale) =>
        `held:${sale.saleId ?? sale.invoiceNumber ?? sale.id}`
    ),

    ...alerts.udhaar.map(
      (customer) =>
        `udhaar:${customer.customerId ?? customer.id}:${Number(customer.currentBalance) || 0}`
    ),

    ...(subscriptionAlert ? [subscriptionAlert.key] : []),
  ];

  const readAlertSet = new Set(readAlertKeys);

  const unreadCount = activeAlertKeys.filter(
    (key) => !readAlertSet.has(key)
  ).length;

  // =========================================
  // MARK ALL ALERTS AS READ
  // =========================================

  const markAllRead = () => {
    const nextReadKeys = [
      ...new Set(activeAlertKeys),
    ];

    setReadAlertKeys(nextReadKeys);

    try {
      window.localStorage.setItem(
        READ_ALERTS_KEY,
        JSON.stringify(nextReadKeys)
      );
    } catch (error) {
      console.error(
        "Could not save notification read state:",
        error
      );
    }
  };

  // =========================================
  // UI
  // =========================================

  return (
    <div className="notification-dropdown" ref={dropdownRef}>

      {/* Bell Button */}

      <button
        type="button"
        className={`notification-btn ${
          unreadCount > 0 ? "has-notification" : ""
        }`}
        onClick={() => {
          setIsOpen(!isOpen);

          if (!isOpen) {
            checkAllAlerts();
          }
        }}
        aria-label={
          unreadCount > 0
            ? `${unreadCount} unread alerts`
            : "Notifications"
        }
        aria-expanded={isOpen}
      >
        <Bell size={18} strokeWidth={1.75} />

        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}

      {isOpen && (
        <div className="notification-dropdown-menu">

          <div className="notification-header">
            <span className="notification-title">
              <AlertCircle size={16} />
              Alerts Center
            </span>

            <div className="notification-header-actions">
              <button
                type="button"
                className="notification-mark-read"
                onClick={markAllRead}
                disabled={unreadCount === 0}
                title="Mark all alerts as read"
              >
                <CheckCheck size={15} />
                <span>Mark all read</span>
              </button>

              <button
                type="button"
                className="notification-refresh"
                onClick={checkAllAlerts}
                disabled={loading}
                aria-label="Refresh notifications"
              >
                <RefreshCw
                  size={16}
                  className={loading ? "spinning" : ""}
                />
              </button>
            </div>
          </div>

          <div className="notification-body">

            {loading ? (
              <div className="notification-loading">
                <RefreshCw size={20} className="spinning" />
                Checking alerts...
              </div>
            ) : (
              <>

                {/* Today's Sales Summary */}

                <div className="sales-summary-banner">
                  <span className="sales-summary-label">
                    <TrendingUp size={16} />
                    Today's Sales
                  </span>

                  <span className="sales-summary-value">
                    Rs {alerts.todaySales.toFixed(2)}
                  </span>
                </div>

                {/* Subscription Alert - Admin Only */}

                {subscriptionAlert && (
                  <div
                    className={`alert-section subscription-alert ${
                      subscriptionAlert.type === "danger"
                        ? "subscription-expired"
                        : "subscription-warning"
                    }`}
                  >
                    <div className="alert-section-header">
                      <span
                        className={`alert-section-title ${
                          subscriptionAlert.type === "danger"
                            ? "danger"
                            : "warning"
                        }`}
                      >
                        <AlertTriangle size={16} />
                        {subscriptionAlert.title}
                      </span>

                      <span className="subscription-status">
                        {subscriptionAlert.type === "danger"
                          ? "Expired"
                          : "Trial"}
                      </span>
                    </div>

                    <p className="subscription-message">
                      {subscriptionAlert.message}
                    </p>

                    <button
                      type="button"
                      className="alert-action-btn subscription-action"
                      onClick={() => {
                        navigate("/settings?tab=subscription");
                        setIsOpen(false);
                      }}
                    >
                      Manage Subscription
                      <ChevronRight size={14} />
                    </button>
                  </div>
                )}

                {/* Held Sales */}

                {alerts.heldSales.length > 0 && (
                  <div className="alert-section">
                    <div className="alert-section-header">
                      <span className="alert-section-title warning">
                        <Clock size={16} />
                        Held Sales
                      </span>

                      <span className="alert-section-count">
                        {alerts.heldSales.length}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        navigate("/pos");
                        setIsOpen(false);
                      }}
                      className="alert-action-btn"
                    >
                      Resume Held Sales
                      <ChevronRight size={14} />
                    </button>
                  </div>
                )}

                {/* Udhaar Pending */}

                {alerts.udhaar.length > 0 && (
                  <div className="alert-section">
                    <div className="alert-section-header">
                      <span className="alert-section-title danger">
                        <Wallet size={16} />
                        Udhaar Pending
                      </span>

                      <span className="alert-section-count">
                        {alerts.udhaar.length}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        navigate("/khata");
                        setIsOpen(false);
                      }}
                      className="alert-action-btn"
                    >
                      Open Khata Ledger
                      <ChevronRight size={14} />
                    </button>
                  </div>
                )}

                {/* Low Stock */}

                {alerts.lowStock.length > 0 && (
                  <div className="alert-section low-stock-notification">
                    <div className="alert-section-header">
                      <span className="alert-section-title warning">
                        <AlertTriangle size={16} />
                        Low stock
                      </span>

                      <span className="alert-section-count">
                        {alerts.lowStock.length} products
                      </span>
                    </div>

                    <ul className="notification-list">
                      {alerts.lowStock.slice(0, 4).map((item) => {
                        const stock =
                          Number(item.currentStock) || 0;

                        const isOutOfStock = stock <= 0;

                        return (
                          <li key={item.productId}>
                            <span className="notification-item-info">
                              <span className="item-name">
                                {item.name}
                              </span>

                              <span className="item-code">
                                {item.code || "No code"}
                              </span>
                            </span>

                            <span
                              className={`notification-item-stock ${
                                isOutOfStock ? "danger" : "warning"
                              }`}
                            >
                              {isOutOfStock ? "Out" : stock} /{" "}
                              {Number(item.minimumStock) || 0}
                            </span>
                          </li>
                        );
                      })}
                    </ul>

                    {alerts.lowStock.length > 4 && (
                      <span className="low-stock-more">
                        +{alerts.lowStock.length - 4} more products
                      </span>
                    )}

                    <button
                      onClick={() => {
                        navigate("/products");
                        setIsOpen(false);
                      }}
                      className="alert-action-btn"
                    >
                      Manage Products
                      <ChevronRight size={14} />
                    </button>
                  </div>
                )}

                {/* Empty State */}

                {activeAlertKeys.length === 0 && (
                  <EmptyState
                    icon={
                      <CheckCircle
                        size={32}
                        strokeWidth={1.5}
                      />
                    }
                    title="All clear!"
                    description="No pending alerts right now."
                    compact
                  />
                )}

              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationDropdown;
