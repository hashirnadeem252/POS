import { useState, useEffect } from "react";
import { RefreshCw, CheckCircle2, CloudOff } from "lucide-react";
import { getMasterDataSyncStatus, MASTER_DATA_SYNC_STATUS_EVENT } from "../../services/masterDataSyncService";
import "../../assets/styles/common/SyncStatusPill.css";

export default function SyncStatusPill() {
  const [status, setStatus] = useState(getMasterDataSyncStatus());

  useEffect(() => {
    const handleSync = (e) => {
      setStatus(e.detail);
    };

    window.addEventListener(MASTER_DATA_SYNC_STATUS_EVENT, handleSync);
    return () => window.removeEventListener(MASTER_DATA_SYNC_STATUS_EVENT, handleSync);
  }, []);

  if (status.status === "syncing") {
    return (
      <div className="sync-pill sync-pill--syncing">
        <RefreshCw size={14} className="spin-icon" />
        <span>Syncing...</span>
      </div>
    );
  }

  if (status.status === "error") {
    return (
      <div className="sync-pill sync-pill--error" title={status.error}>
        <CloudOff size={14} />
        <span>Sync failed</span>
      </div>
    );
  }

  // If synced successfully
  const lastSyncedText = status.lastSyncedAt
    ? `Last synced ${new Date(status.lastSyncedAt).toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" })}`
    : "Ready";

  return (
    <div className="sync-pill sync-pill--success">
      <CheckCircle2 size={14} />
      <span>{lastSyncedText}</span>
    </div>
  );
}