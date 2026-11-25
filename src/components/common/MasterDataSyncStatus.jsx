import { useEffect, useState } from "react";
import { Check, RefreshCw, Wifi, WifiOff } from "lucide-react";
import {
  getMasterDataSyncStatus,
  MASTER_DATA_SYNC_STATUS_EVENT,
  refreshMasterData,
} from "../../services/masterDataSyncService";
import { notify } from "../../utils/notify";
import { getCurrentAuthTenantId } from "../../utils/authTenant";
import "./MasterDataSyncStatus.css";

function formatLastSync(lastSyncedAt, now) {
  if (!lastSyncedAt) return "Data sync pending";

  const minutes = Math.max(0, Math.floor((now - lastSyncedAt.getTime()) / 60000));
  if (minutes < 1) return "Data synced just now";
  if (minutes === 1) return "Data synced 1 min ago";
  return `Data synced ${minutes} min ago`;
}

export default function MasterDataSyncStatus() {
  const [isOnline, setIsOnline] = useState(
    () => typeof navigator === "undefined" || navigator.onLine
  );
  const [syncStatus, setSyncStatus] = useState(getMasterDataSyncStatus);
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    const updateNetworkStatus = () => setIsOnline(navigator.onLine);
    const updateSyncStatus = (event) => {
      if (event.detail?.tenantId !== getCurrentAuthTenantId()) return;
      setSyncStatus(event.detail || getMasterDataSyncStatus());
      setNow(Date.now());
    };

    window.addEventListener("online", updateNetworkStatus);
    window.addEventListener("offline", updateNetworkStatus);
    window.addEventListener(MASTER_DATA_SYNC_STATUS_EVENT, updateSyncStatus);

    const clock = window.setInterval(() => setNow(Date.now()), 60000);
    return () => {
      window.removeEventListener("online", updateNetworkStatus);
      window.removeEventListener("offline", updateNetworkStatus);
      window.removeEventListener(MASTER_DATA_SYNC_STATUS_EVENT, updateSyncStatus);
      window.clearInterval(clock);
    };
  }, []);

  const handleRefresh = async () => {
    if (!isOnline) {
      notify.warning("Connect to the internet to sync master data.");
      return;
    }

    try {
      await refreshMasterData();
      notify.success("Master data is up to date.");
    } catch {
      notify.error(
        "Some master data could not be refreshed. Cached data remains available."
      );
    }
  };

  const isSyncing = syncStatus.status === "syncing";
  const statusText = isSyncing
    ? "Syncing data..."
    : syncStatus.status === "error"
      ? "Some data sync delayed"
      : formatLastSync(syncStatus.lastSyncedAt, now);

  return (
    <div className="master-data-sync-status">
      <span
        className={`master-data-sync-connection ${isOnline ? "is-online" : "is-offline"}`}
        title={isOnline ? "Internet connection detected" : "No internet connection"}
        role="status"
        aria-live="polite"
      >
        {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
        <span>{isOnline ? "Online" : "Offline"}</span>
      </span>
      <span
        className={`master-data-sync-last-updated ${syncStatus.status === "error" ? "has-sync-error" : ""}`}
        title="Products, customers, salespeople, suppliers, categories, brands, and units sync every 5 minutes while online."
      >
        {syncStatus.status === "idle" && syncStatus.lastSyncedAt && (
          <Check size={13} />
        )}
        {statusText}
      </span>
      <button
        type="button"
        className="master-data-sync-refresh"
        onClick={handleRefresh}
        disabled={isSyncing || !isOnline}
        aria-label="Sync master data"
        title={isOnline ? "Sync master data now" : "Reconnect to sync master data"}
      >
        <RefreshCw size={15} className={isSyncing ? "is-spinning" : ""} />
      </button>
    </div>
  );
}
