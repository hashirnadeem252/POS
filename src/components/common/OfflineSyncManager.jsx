import { useEffect, useRef } from "react";
import { offlineQueue } from "../../services/indexdb/offlineQueue";
import { createSale } from "../../services/SaleDefinition/saleService";
import { notify } from "../../utils/notify";
import { useAuth } from "../../hooks/auth/useAuth";
import { getAuthTenantId } from "../../utils/authTenant";

export default function OfflineSyncManager() {
  const isSyncingRef = useRef(false);
  const warnedUnassignedRef = useRef(false);
  const { isAuthenticated, loading, user } = useAuth();
  const tenantId = getAuthTenantId(user);

  useEffect(() => {
    if (loading || !isAuthenticated || !tenantId) return undefined;

    let active = true;
    let retryTimer = null;

    const syncSales = async () => {
      if (
        !active ||
        typeof navigator === "undefined" ||
        !navigator.onLine
      ) {
        return;
      }

      if (isSyncingRef.current) {
        if (retryTimer === null) {
          retryTimer = window.setTimeout(() => {
            retryTimer = null;
            void syncSales();
          }, 1000);
        }
        return;
      }

      isSyncingRef.current = true;
      let pendingSales = [];
      let successCount = 0;
      let syncFailed = false;

      try {
        try {
          pendingSales = await offlineQueue.getAll();
          const unassignedCount = await offlineQueue.getUnassignedCount();
          if (active && unassignedCount > 0 && !warnedUnassignedRef.current) {
            warnedUnassignedRef.current = true;
            notify.warning(
              "Some saved offline sales are not linked to a shop and were left unsynced."
            );
          }
        } catch (error) {
          console.error("Unable to read offline sales queue:", error);
          if (active) notify.error("Unable to access saved offline sales.");
          return;
        }

        if (!active || pendingSales.length === 0) return;
        notify.info(`Syncing ${pendingSales.length} offline sales...`);

        for (const sale of pendingSales) {
          if (!active || !navigator.onLine) break;

          if (
            !sale ||
            typeof sale !== "object" ||
            !sale.localId ||
            sale.tenantId !== tenantId
          ) {
            console.error("Offline sale sync paused because queued sale metadata is invalid.");
            if (active) {
              notify.error("Offline sale sync paused: a saved sale is invalid or belongs to another shop.");
            }
            syncFailed = true;
            break;
          }

          try {
            const cleanSale = { ...sale };
            delete cleanSale.localId;
            delete cleanSale.principalId;
            delete cleanSale.tenantId;
            delete cleanSale.queuedAt;

            await createSale(cleanSale);
            await offlineQueue.remove(sale.localId);
            successCount += 1;
          } catch (error) {
            console.error("Failed to sync offline sale:", error);
            if (active) {
              notify.error("Offline sale sync paused. Saved sales remain queued.");
            }
            syncFailed = true;
            break;
          }
        }
      } finally {
        isSyncingRef.current = false;
      }

      if (
        active &&
        !syncFailed &&
        successCount > 0 &&
        successCount === pendingSales.length
      ) {
        notify.success("Sync complete!");
      }
    };

    window.addEventListener("online", syncSales);
    
    // ✅ Just run sync directly (migration removed)
    void syncSales();

    return () => {
      active = false;
      window.removeEventListener("online", syncSales);
      if (retryTimer !== null) window.clearTimeout(retryTimer);
    };
  }, [isAuthenticated, loading, tenantId]);

  return null;
}