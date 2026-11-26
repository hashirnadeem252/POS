# SaleKhata POS — Project Architecture

## 1. Overview

SaleKhata POS is a React 19 single-page application for retail operations. It is built with Vite and provides authentication, POS/sales, sales returns, purchases, GRN, product and party management, barcode generation, dashboards, settings, users, customer ledgers, end-of-day processing, and offline support.

The frontend communicates with an ASP.NET-style REST API at `https://localhost:7219` and uses Dexie/IndexedDB for tenant-scoped local caching and pending sale synchronization.

## 2. Technology Stack

- **Framework:** React 19
- **Build Tool:** Vite 8
- **Routing:** React Router 7
- **State:** Redux Toolkit for UI state and React Context for auth/settings
- **Local Database:** Dexie (IndexedDB)
- **Internationalization:** i18next and i18next-browser-languagedetector
- **Styling:** Modular CSS and global design tokens
- **Charts:** Chart.js and react-chartjs-2
- **UI/Utilities:** Lucide React, SweetAlert2, React Hot Toast, date-fns
- **Imports/Exports:** read-excel-file, html2pdf.js, Spreadsheet utilities
- **Barcodes:** JsBarcode and `@veloxdevworks/barcodes`

## 3. High-Level Structure

```text
POS/
├── public/                 Static icons and branding assets
├── src/
│   ├── assets/             Images and CSS styles
│   ├── components/         Reusable UI and feature components
│   ├── contexts/           Authentication and settings providers
│   ├── hooks/              Shared and feature-specific hooks
│   ├── layouts/            Application shell/layout
│   ├── locales/            English and Urdu translation resources
│   ├── models/             Table columns and search/export configuration
│   ├── pages/              Route-level screens
│   ├── services/           API, offline storage, and synchronization services
│   ├── store/              Redux store and UI slices
│   ├── utils/              Cross-cutting helpers
│   ├── App.jsx             Providers, routing, and application composition
│   ├── i18n.js             Internationalization setup
│   └── main.jsx            React bootstrap and Redux integration
├── index.html              HTML entry document
├── package.json            Dependencies and scripts
├── vite.config.js          Vite configuration
└── architecture.md         This architecture document
```

## 4. Application Entry and Routing

| File | Purpose |
|---|---|
| `index.html` | Browser entry document, metadata, favicon, font and root mount point |
| `src/main.jsx` | Mounts React, Redux Provider, global styles, i18n and `App` |
| `src/App.jsx` | Defines providers, lazy-loaded routes, protected routes, loaders and sync managers |
| `src/layouts/MainLayout.jsx` | Shared dashboard shell with navigation, breadcrumbs, language controls and user menu |

`App.jsx` separates public pages from full-screen POS and authenticated dashboard routes. Pages are lazy-loaded for code splitting. `ProtectedRoute` prevents unauthenticated access, while `OfflineSyncManager` and `MasterDataSyncManager` run only after session restoration.

## 5. Pages

| Area | Files | Responsibility |
|---|---|---|
| Authentication | `Login`, `Signup`, `ForgotPassword`, `ResetPassword`, `Welcome` | Account access and recovery |
| Dashboard | `Dashboard`, `EndOfDay` | Sales overview, charts and period closing |
| Catalog | `ProductDefinition`, `ProductBarcode` | Product maintenance and barcode templates/printing |
| Parties | `SupplierDefinition`, `CustomerDefinition`, `CustomersLedger`, `SalesPersonDefinition` | Party data, balances and ledger operations |
| Purchasing | `PurchaseDefinition`, `GRNDefinition` | Purchase entry and goods receipt processing |
| Sales | `SalesAndReturn` | POS, sales, holds and return workflows |
| Administration | `Users`, `Settings`, `settings/StoreSettings`, `settings/SubscriptionBilling` | User, store and subscription management |

## 6. Components

### Shared Components

`src/components/common/` contains reusable tables, forms, dialogs, lookup modals, pagination, search controls, loaders, notifications, protected routing, synchronization status and empty states.

### Feature Components

- `auth/` — authentication layouts, inputs and password controls
- `barcode/` — barcode preview, printing and template selection
- `customers/` — customer form and related UI
- `grn/` — GRN master fields, product/purchase pickers, details table and comments
- `products/` — product form and spreadsheet import
- `purchases/` — purchase form and detail rows
- `sales/` — POS header, cart, totals, search, hold, invoice and transaction modals
- `salesreturn/` — sales return form
- `salespersons/` — sales-person form
- `suppliers/` — supplier form and payment modal

## 7. State Management

### Redux

`src/store/store.js` configures:

- `breadcrumbSlice.js` — current route breadcrumbs
- `loadingSlice.js` — application loading state

`src/hooks/useGlobalLoader.js` provides loading control consumed by the UI.

### React Context

- `AuthContext.jsx` — session restoration, login/signup/logout, JWT/refresh token storage, subscription and tenant guard
- `SettingsContext.jsx` — store configuration and currency formatting

### Custom Hooks

- `hooks/useAuth.js` and `hooks/auth/useAuth.js` — AuthContext access
- `hooks/useSearch.js` — reusable search behavior
- `hooks/useExport.js` — export workflow
- `hooks/pos/` — POS cart, master data, sale loading and transaction operations
- `hooks/auth/` — authentication-related hooks

## 8. API and Service Layer

`src/services/apiClient.js` is the central HTTP layer. It:

- Targets `https://localhost:7219`
- Adds bearer access tokens
- Refreshes expired access tokens through `/api/Auth/refresh`
- Handles JSON/FormData request bodies
- Redirects expired sessions to login
- Handles trial-expiry redirects
- Converts API errors into JavaScript `Error` objects

Feature services are grouped under `src/services/<Feature>/` for auth, products, brands, categories, suppliers, customers, sales, sales returns, purchases, GRN, users, settings, salespersons, units and barcodes.

Typical responsibilities include CRUD requests, filtering/search, lookup data and master-data cache refresh.

## 9. Offline and Synchronization Architecture

The IndexedDB database is implemented in `src/services/indexdb/db.js` using Dexie.

### Tenant-Scoped Data

Cached records use compound keys based on tenant/shop ID and entity ID. This prevents data from one shop overwriting or reading another shop's cache.

Stores include:

- Products, suppliers, customers, salespersons
- Units, brands and categories
- Sequences
- Sync state
- Pending sales

### Synchronization

- `masterDataSyncService.js` downloads master data and periodically refreshes it, publishing progress and status events.
- `indexdb/masterDataCache.js` replaces tenant-specific cache snapshots.
- Offline managers queue sales and synchronization work and synchronize pending operations when connectivity returns.
- Logout clears tenant-local data while preserving unsynced sales where required.

## 10. Models and Configuration

`src/models/` contains presentation metadata rather than domain entities:

- Table column definitions
- Product, purchase, sales, supplier and customer lookup columns
- Search field definitions
- Export configurations

`src/utils/` contains application-wide helpers:

- `exportUtils.js` — export formatting
- `importTemplates.js` — spreadsheet template definitions
- `spreadsheetImport.js` — spreadsheet parsing/import
- `notify.js` — toast and notification helpers
- `authTenant.js` — tenant extraction and validation

## 11. Internationalization and Styling

- `src/i18n.js` initializes i18next with English and Urdu resources.
- `src/locales/en.json` and `src/locales/ur.json` contain translations.
- Language changes update HTML language and RTL/LTR direction.
- `src/assets/styles/variables.css` defines reusable design tokens.
- `src/assets/styles/global.css` defines global styles.
- Feature styles are organized by domain beneath `src/assets/styles/`.

## 12. Request and Data Flow

```text
Page / Feature Component
        ↓
Custom Hook or Context
        ↓
Feature Service
        ↓
apiClient.js  ←→  REST API
        ↓
Dexie / IndexedDB for cached or queued data
        ↓
Component rendering and Redux/UI updates
```

Authentication state originates in `AuthContext`, API access passes through `apiClient`, and the local database supplies offline-capable master data and pending sales.

## 13. Development Commands

```text
npm run dev          Start Vite development server
npm run build        Build production assets
npm run preview      Preview the production build
npm run lint         Run ESLint
```

## 14. Architectural Guidelines

- Keep route-level logic in `pages/` and reusable behavior in `components/` and `hooks/`.
- Put REST operations in feature services; keep components independent of direct fetch logic.
- Use `apiClient.js` for authenticated API requests and token refresh behavior.
- Scope persistent data by tenant/shop ID.
- Never replace pending or unsynced sales during cache refresh.
- Keep table/search/export metadata in `models/`.
- Keep translations synchronized in both locale files.
