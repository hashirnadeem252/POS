import { useEffect } from "react";
import { useAuth } from "../../hooks/auth/useAuth";
import { startMasterDataAutoSync } from "../../services/masterDataSyncService";
import { purgeOtherTenantsCache } from "../../services/indexdb/db";
import { getAuthTenantId } from "../../utils/authTenant";

export default function MasterDataSyncManager() {
  const { isAuthenticated, loading, user } = useAuth();
  const tenantId = getAuthTenantId(user);

  // Another tab logged into a different shop: reload this tab so the two
  // can never mix. The "storage" event only fires in the OTHER tabs.
  useEffect(() => {
    const onStorage = (event) => {
      if (event.key === "pos_auth_user") window.location.reload();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (loading || !isAuthenticated || tenantId == null) return undefined;

    let cancelled = false;
    let stop = () => {};

    // Keep only this shop's cached master data on the device, then start sync.
    // Unsynced sales and code counters are never touched by the purge.
    purgeOtherTenantsCache(tenantId)
      .catch((error) =>
        console.error("Could not purge other shops' cached data:", error)
      )
      .finally(() => {
        if (!cancelled) stop = startMasterDataAutoSync(tenantId, 5);
      });

    return () => {
      cancelled = true;
      stop();
    };
  }, [isAuthenticated, loading, tenantId]);

  return null;
}