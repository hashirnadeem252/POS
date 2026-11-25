import { useState, useEffect } from "react";
import { RefreshCw, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { 
  refreshMasterData, 
  MASTER_DATA_SYNC_STATUS_EVENT,
  MASTER_DATA_SYNC_PROGRESS_EVENT
} from "../../services/masterDataSyncService";
import { notify } from "../../utils/notify";
import "../../assets/styles/common/MasterSyncModal.css";

const ENTITIES = [
  { key: "products", label: "Products" },
  { key: "customers", label: "Customers" },
  { key: "suppliers", label: "Suppliers" },
  { key: "salesPersons", label: "Sales Persons" },
  { key: "categories", label: "Categories" },
  { key: "brands", label: "Brands" },
  { key: "units", label: "Units" },
];

export default function MasterSyncModal({ isOpen, onClose }) {
  const [progress, setProgress] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [statusMap, setStatusMap] = useState({});
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (isOpen) {
      setProgress(0);
      setIsSyncing(false);
      setStatusMap({});
      setErrorMessage("");
    }
  }, [isOpen]);

  useEffect(() => {
    const handleProgress = (event) => {
      const { entity, status, percentage } = event.detail;
      setProgress(percentage);
      setStatusMap((prev) => ({ ...prev, [entity]: status }));
    };

    const handleStatus = (event) => {
      const { status, error } = event.detail;
      if (status === "error") setErrorMessage(error || "Sync failed");
    };

    window.addEventListener(MASTER_DATA_SYNC_PROGRESS_EVENT, handleProgress);
    window.addEventListener(MASTER_DATA_SYNC_STATUS_EVENT, handleStatus);
    
    return () => {
      window.removeEventListener(MASTER_DATA_SYNC_PROGRESS_EVENT, handleProgress);
      window.removeEventListener(MASTER_DATA_SYNC_STATUS_EVENT, handleStatus);
    };
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    setProgress(0);
    setErrorMessage("");
    
    setStatusMap(ENTITIES.reduce((acc, curr) => ({ ...acc, [curr.key]: "pending" }), {}));

    try {
      await refreshMasterData();
      notify.success("Master data synced successfully!");
    } catch (error) {
      console.error("Sync failed:", error);
      setErrorMessage("Some data failed to sync. Please try again.");
    } finally {
      setIsSyncing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="sync-modal-overlay" onClick={onClose}>
      <div className="sync-modal-content" onClick={(e) => e.stopPropagation()}>
        
        <div className="sync-modal-header">
          <h2>Sync Master Data</h2>
          <button className="sync-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="sync-modal-body">
          <div className="sync-progress-container">
            <svg className="sync-progress-ring" width="120" height="120">
              <circle className="sync-progress-ring-circle-bg" stroke="#E2E8F0" strokeWidth="8" fill="transparent" r="52" cx="60" cy="60" />
              <circle 
                className="sync-progress-ring-circle" 
                stroke="#0D9488" 
                strokeWidth="8" 
                fill="transparent" 
                r="52" 
                cx="60" 
                cy="60" 
                style={{ strokeDasharray: `${(progress / 100) * 327} 327` }}
              />
            </svg>
            <span className="sync-progress-text">{progress}%</span>
          </div>

          <h3 className="sync-modal-title">
            {isSyncing ? "Syncing master data..." : progress === 100 ? "Sync Complete" : "Ready to Sync"}
          </h3>
          <p className="sync-modal-subtitle">
            {isSyncing ? "Please wait while we update your local cache." : "Ensure you have a stable internet connection."}
          </p>

          <div className="sync-status-list">
            {ENTITIES.map((entity) => {
              const status = statusMap[entity.key];
              return (
                <div key={entity.key} className="sync-status-item">
                  <span>{entity.label}</span>
                  {status === "pending" && <RefreshCw size={16} className="text-gray animate-spin" />}
                  {status === "success" && <CheckCircle2 size={16} className="text-green" />}
                  {status === "error" && <XCircle size={16} className="text-red" />}
                  {!status && <AlertCircle size={16} className="text-gray-300" />}
                </div>
              );
            })}
          </div>

          {errorMessage && <div className="sync-error-message">{errorMessage}</div>}
        </div>

        <div className="sync-modal-footer">
          <button className="btn btn-outline" onClick={onClose} disabled={isSyncing}>
            Close
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleSync} 
            disabled={isSyncing || progress === 100}
          >
            {isSyncing ? "Syncing..." : progress === 100 ? "Synced" : "Start Sync"}
          </button>
        </div>

      </div>
    </div>
  );
}