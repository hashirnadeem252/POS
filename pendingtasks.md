#separate tenantid added for separte online data but still same issue presists for index db we ave to solve this : done AS : (### How IndexedDB is separated by shop

- The master-data database is now named per tenant: `POSSystemDB_tenant_<tenantId>`. Products, customers, suppliers, categories, brands, units, and salespeople are stored in that shop’s database. See `db.js`.
- The offline-sales queue is also per tenant: `SaleKhataOffline_tenant_<tenantId>`. Tenant-tagged legacy sales are migrated; sales without a trustworthy shop ID stay unsynced. See `offlineDb.js` and `offlineQueue.js`.
- Cashiers with the **same tenant ID** share that shop’s local data on the same browser/device. Different shops get different databases. Different devices still get their data from the backend, not from each other’s IndexedDB.
- Sync work and update events are tenant-scoped, and other tabs reload when the signed-in account changes. See `masterDataSyncService.js` and `AuthContext.jsx`.
- The old unpartitioned master cache is cleared rather than risk assigning mixed data to the wrong shop. Each shop should connect once after the update to populate its new cache.

### Is it safe and production-ready?

It is **substantially safer and built around the right tenant boundary**, but database names are an application-level separation—not encryption or a security barrier. A browser page from the same origin can access its IndexedDB databases. The backend must continue enforcing tenant authorization on every request; the existing tenant claim and staff assignment support that model in `JwtService.cs` and `UserRepository.cs`.

The production build passed, and browser checks confirmed that matching record keys remain isolated across two test tenants. **I would not call this fully production-verified yet:** real-account cashier switching, a deployment migration with representative existing queues, and offline/reconnect tests still need to be exercised.)
#Pending Task: Add frontend RBAC (isAdmin checks to hide Edit/Delete/Add/Import buttons from Cashiers across all pages).