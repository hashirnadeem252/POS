// App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState, lazy, Suspense } from "react";
import { Toaster } from "react-hot-toast";

import { openDB } from "./services/indexdb/db";

// Product services
import { getProducts } from "./services/ProductDefinition/productService";
import {
  saveProductsToIndexedDB,
  hasProductsInIndexedDB,
} from "./services/indexdb/productService";
import {
  startAutoRefresh,
  stopAutoRefresh,
} from "./services/ProductDefinition/productService";

// Customer services
import { getCustomers } from "./services/CustomerDefinition/customerService";
import {
  saveCustomersToIndexedDB,
  hasCustomersInIndexedDB,
} from "./services/indexdb/customerService";

// Sales Person services
import { getSalesPersons } from "./services/SalesPersonDefinition/salesPersonService";
import {
  saveSalesPersonsToIndexedDB,
  hasSalesPersonsInIndexedDB,
} from "./services/indexdb/salesPersonService";

import MainLayout from "./layouts/MainLayout";

// ✅ Auth
import { AuthProvider } from "./contexts/AuthContext";
import { SettingsProvider } from "./contexts/SettingsContext";
import ProtectedRoute from "./components/common/ProtectedRoute";

// =========================
// LAZY IMPORTS — Code Splitting
// =========================
// Only loaded when the user navigates to that route
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
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        fontFamily: "system-ui, sans-serif",
        color: "#6B7A8F",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: "40px",
            height: "40px",
            border: "3px solid #EAEDF2",
            borderTopColor: "#0D9488",
            borderRadius: "50%",
            margin: "0 auto 16px",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <p style={{ margin: 0, fontWeight: 500 }}>Loading...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

function App() {
  const [dbReady, setDbReady] = useState(false);

  // =========================
  // INIT DB
  // =========================
  useEffect(() => {
    const initDB = async () => {
      try {
        await openDB();
        console.log("📁 IndexedDB initialized successfully");
        setDbReady(true);
      } catch (error) {
        console.error("❌ IndexedDB initialization failed:", error);
        setDbReady(true);
      }
    };
    initDB();
  }, []);

  // =========================
  // SYNC MASTER DATA + AUTO REFRESH
  // =========================
  useEffect(() => {
    if (!dbReady) return;

    const syncMasterData = async () => {
      try {
        const hasProducts = await hasProductsInIndexedDB();
        if (!hasProducts) {
          console.log("📡 Syncing products to IndexedDB...");
          const products = await getProducts();
          await saveProductsToIndexedDB(products);
          console.log("✅ Products synced to IndexedDB");
        }

        const hasCustomers = await hasCustomersInIndexedDB();
        if (!hasCustomers) {
          console.log("📡 Syncing customers to IndexedDB...");
          const customers = await getCustomers();
          await saveCustomersToIndexedDB(customers);
          console.log("✅ Customers synced to IndexedDB");
        }

        const hasSalesPersons = await hasSalesPersonsInIndexedDB();
        if (!hasSalesPersons) {
          console.log("📡 Syncing sales persons to IndexedDB...");
          const persons = await getSalesPersons();
          await saveSalesPersonsToIndexedDB(persons);
          console.log("✅ Sales persons synced to IndexedDB");
        }
      } catch (error) {
        console.error("❌ Error syncing master data:", error);
      }
    };

    syncMasterData();

    try {
      startAutoRefresh(5);
      console.log("🔄 Auto-refresh started (every 5 minutes)");
    } catch (error) {
      console.error("❌ Failed to start auto-refresh:", error);
    }

    return () => {
      try {
        stopAutoRefresh();
        console.log("⏹️ Auto-refresh stopped");
      } catch (error) {
        console.error("❌ Failed to stop auto-refresh:", error);
      }
    };
  }, [dbReady]);

  // =========================
  // LOADING SCREEN
  // =========================
  if (!dbReady) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "40px", marginBottom: "16px" }}>🗄️</div>
          <h2>Initializing Database...</h2>
          <p style={{ color: "#6B7A8F" }}>Please wait</p>
        </div>
      </div>
    );
  }

  // =========================
  // RENDER
  // =========================
  return (
    <SettingsProvider>
      <AuthProvider>
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
          {/* ✅ Suspense wraps ALL routes — shows the loader while lazy pages download */}
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
      </AuthProvider>
    </SettingsProvider>
  );
}

export default App;