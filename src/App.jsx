// App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Toaster } from "react-hot-toast";
import { useAuth } from "./hooks/auth/useAuth"; // ✅ Added

import MainLayout from "./layouts/MainLayout";

// ✅ Auth
import { AuthProvider } from "./contexts/AuthContext";
import { SettingsProvider } from "./contexts/SettingsContext";
import ProtectedRoute from "./components/common/ProtectedRoute";
import OfflineSyncManager from "./components/common/OfflineSyncManager";
import MasterDataSyncManager from "./components/common/MasterDataSyncManager";
import DataLoader, { GlobalDataLoader } from "./components/common/DataLoader";

// =========================
// LAZY IMPORTS — Code Splitting
// =========================
const Welcome = lazy(() => import("./pages/Welcome"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

const Dashboard = lazy(() => import("./pages/Dashboard"));
const ProductDefinition = lazy(() => import("./pages/ProductDefinition"));
const ProductBarcode = lazy(() => import("./pages/ProductBarcode"));
const SupplierDefinition = lazy(() => import("./pages/SupplierDefinition"));
const CustomerDefinition = lazy(() => import("./pages/CustomerDefinition"));
const SalesPersonDefinition = lazy(() => import("./pages/SalesPersonDefinition"));
const PurchaseDefinition = lazy(() => import("./pages/PurchaseDefinition"));
const GRNDefinition = lazy(() => import("./pages/GRNDefinition"));
const SalesAndReturn = lazy(() => import("./pages/SalesAndReturn"));
const Settings = lazy(() => import("./pages/Settings"));
const Users = lazy(() => import("./pages/Users"));
const CustomersLedger = lazy(() => import("./pages/CustomersLedger"));
const EndOfDay = lazy(() => import("./pages/EndOfDay"));

// ✅ Full-page loading fallback
function PageLoader() {
  return <DataLoader fullPage message="Loading page..." size="large" />;
}

// ✅ NEW: Wrapper that waits for Auth to be ready before mounting sync managers
function AuthenticatedSyncManagers() {
  const { isAuthenticated, loading } = useAuth();

  // Do nothing until the auth context has restored the session
  if (loading || !isAuthenticated) return null;

  return (
    <>
      <OfflineSyncManager />
      <MasterDataSyncManager />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <Toaster
          position="top-right"
          reverseOrder={false}
          gutter={8}
          containerClassName="toast-container"
          containerStyle={{ zIndex: 9999999, top: 20, right: 20 }}
          toastOptions={{
            duration: 3500,
            style: {
              background: "var(--color-surface, #fff)",
              color: "var(--color-text-primary, #12203A)",
              border: "1px solid var(--color-border-light, #EAEDF2)",
              borderRadius: "8px",
              padding: "12px 16px",
              fontSize: "13px",
              fontWeight: "500",
              boxShadow: "0 8px 24px rgba(18, 32, 58, 0.12)",
              maxWidth: "420px",
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: "var(--color-success, #1E8F55)",
                secondary: "#fff",
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: "var(--color-danger, #C23B36)",
                secondary: "#fff",
              },
            },
            loading: {
              iconTheme: {
                primary: "var(--color-primary, #0D9488)",
                secondary: "#fff",
              },
            },
          }}
        />

        <BrowserRouter>
          <GlobalDataLoader />
          
          {/* ✅ Only run background sync when authenticated */}
          <AuthenticatedSyncManagers />

          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* PUBLIC ROUTES */}
              <Route path="/" element={<Welcome />} />
              <Route path="/welcome" element={<Welcome />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* PROTECTED — FULL SCREEN (POS) */}
              <Route element={<ProtectedRoute />}>
                <Route path="/pos" element={<SalesAndReturn />} />
              </Route>

              {/* PROTECTED — DASHBOARD */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<MainLayout />}>
                  <Route index element={<Dashboard />} />
                </Route>
              </Route>

              {/* PROTECTED — MAIN LAYOUT */}
              <Route element={<ProtectedRoute />}>
                <Route element={<MainLayout />}>
                  <Route path="/products" element={<ProductDefinition />} />
                  <Route path="/products/barcode" element={<ProductBarcode />} />
                  <Route path="/suppliers" element={<SupplierDefinition />} />
                  <Route path="/customers" element={<CustomerDefinition />} />
                  <Route path="/purchases" element={<PurchaseDefinition />} />
                  <Route path="/grn" element={<GRNDefinition />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/khata" element={<CustomersLedger />} />
                  <Route path="/end-of-day" element={<EndOfDay />} />
                  <Route path="/users" element={<Users />} />
                  <Route path="/salespersons" element={<SalesPersonDefinition />} />
                </Route>
              </Route>

              {/* CATCH-ALL */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;