// pages/Dashboard.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement, Filler,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import {
  Package, Users, ShoppingBag, Clock, AlertTriangle, ShoppingCart, TrendingUp, TrendingDown, PieChart, BarChart3, ChevronRight, Wallet
} from "lucide-react";
import { getSales } from "../services/SaleDefinition/saleService";
import { getProductsFromIndexedDB } from "../services/indexdb/productService";
import { getCustomers } from "../services/CustomerDefinition/customerService";
import { getPurchases } from "../services/PurchaseDefinition/purchaseService";
import { api } from "../services/apiClient";
import EmptyState from "../components/common/EmptyState";
import SyncStatusPill from "../components/common/SyncStatusPill";
import { useAuth } from "../hooks/auth/useAuth";
import { useGlobalLoader } from "../hooks/useGlobalLoader";
import { useTranslation } from "react-i18next";
import { useSettings } from "../contexts/SettingsContext";
import DataLoader from "../components/common/DataLoader"; // ✅ Imported your existing loader
import { requireCurrentAuthTenantId } from "../utils/authTenant"; // ✅ Needed for IndexedDB
import "../assets/styles/Dashboard.css";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement, Filler);

function getLocalDateString(date) {
  const value = new Date(date);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

function getLast7DaysSales(sales) {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateString = getLocalDateString(date);
    const daySales = sales.filter(
      (sale) =>
        getLocalDateString(sale.saleDate) === dateString &&
        sale.status?.toLowerCase() === "completed"
    );
    days.push({
      date: dateString,
      total: daySales.reduce((sum, sale) => sum + sale.total, 0),
      count: daySales.length,
    });
  }
  return days;
}

function getCategorySales(sales, products) {
  const categories = {};
  sales.forEach((sale) => {
    if (sale.status?.toLowerCase() !== "completed") return;
    sale.details?.forEach((detail) => {
      const product = products.find((item) => item.productId === detail.productId);
      const category = product?.categoryName || "";
      categories[category] = (categories[category] || 0) + (detail.total || 0);
    });
  });
  return Object.entries(categories)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
}

const StatusBadge = ({ status }) => {
  const { t } = useTranslation();
  const statusMap = {
    Completed: { className: "dot-success", label: t("dashboard.completed") },
    Draft: { className: "dot-neutral", label: t("dashboard.draft") },
    Pending: { className: "dot-warning", label: t("dashboard.pending") },
    Cancelled: { className: "dot-danger", label: t("dashboard.cancelled") },
  };
  const meta = statusMap[status] || statusMap.Draft;
  return (
    <span className="status-pill">
      <span className={`status-dot ${meta.className}`} />
      {meta.label}
    </span>
  );
};

const MetricItem = ({ icon: Icon, value, label, onClick, variant }) => {
  const iconClass = variant === "warning" ? "metric-icon--warning" : variant === "danger" ? "metric-icon--danger" : "";
  return (
    <div className="metric-item" onClick={onClick}>
      <span className={`metric-icon ${iconClass}`}>
        <Icon size={20} strokeWidth={2} />
      </span>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <span className="metric-value">{value}</span>
        <span className="metric-label">{label}</span>
      </div>
    </div>
  );
};

function Dashboard() {
  const { t, i18n } = useTranslation();
  const { formatCurrency } = useSettings();
  const navigate = useNavigate();
   const { user } = useAuth();
   const activeTenantId = user?.tenantId;
  
  // ✅ Separate loading states for a staggered, professional feel
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingCharts, setIsLoadingCharts] = useState(true);
  const [isLoadingLists, setIsLoadingLists] = useState(true);

  const [stats, setStats] = useState({
    totalProducts: 0, todaySales: 0, todayPurchases: 0, totalCustomers: 0,
    totalSales: 0, pendingOrders: 0, lowStockCount: 0, totalUdhaar: 0
  });
  
  const [recentSales, setRecentSales] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [dailySales, setDailySales] = useState([]);
  const [categorySales, setCategorySales] = useState([]);

   useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const tenantId = requireCurrentAuthTenantId();
        
        // ✅ Safety guard — don't load if no tenant (e.g., during logout)
        if (!tenantId) {
          console.warn("Dashboard: no active tenant, skipping load.");
          setIsLoadingStats(false);
          setIsLoadingCharts(false);
          setIsLoadingLists(false);
          return;
        }
        
        // Fetch data in parallel
        const [sales, products, customers, purchases, khataBalances] = await Promise.all([
          getSales(),
          getProductsFromIndexedDB(tenantId), // ✅ Passed tenantId
          getCustomers(),
          getPurchases(),
          api.get("/api/Customers/balances").catch(() => []),
        ]);

        const salesList = sales || [];
        const productList = products || [];
        const today = getLocalDateString(new Date());
        
        const todaySales = salesList.filter(
          (sale) => getLocalDateString(sale.saleDate) === today && sale.status?.toLowerCase() === "completed"
        );
        const todayPurchases = (purchases || []).filter(
          (purchase) => getLocalDateString(purchase.purchaseDate) === today
        );
        const lowStock = productList.filter(
          (product) => product.currentStock <= product.minimumStock && product.currentStock > 0
        );
        const outOfStock = productList.filter(
          (product) => product.currentStock <= 0
        );
        const totalUdhaar = khataBalances?.reduce(
          (sum, customer) => sum + Number(customer.currentBalance || 0), 0
        ) || 0;

        setStats({
          totalProducts: productList.length,
          todaySales: todaySales.reduce((sum, sale) => sum + sale.total, 0),
          todayPurchases: todayPurchases.reduce((sum, purchase) => sum + purchase.total, 0),
          totalCustomers: customers.length,
          totalSales: salesList.filter((sale) => sale.status?.toLowerCase() === "completed").length,
          pendingOrders: salesList.filter((sale) => ["draft", "pending"].includes(sale.status?.toLowerCase())).length,
          lowStockCount: lowStock.length + outOfStock.length,
          totalUdhaar,
        });
        
        setRecentSales(
          salesList
            .filter((sale) => sale.status?.toLowerCase() === "completed")
            .sort((a, b) => new Date(b.saleDate) - new Date(a.saleDate))
            .slice(0, 5)
        );
        
        setLowStockItems([...outOfStock, ...lowStock].slice(0, 5));
        setDailySales(getLast7DaysSales(salesList));
        setCategorySales(getCategorySales(salesList, productList));

      } catch (error) {
        console.error("Error loading dashboard:", error);
      } finally {
        // Turn off loaders once data is ready
        setIsLoadingStats(false);
        setIsLoadingCharts(false);
        setIsLoadingLists(false);
      }
    };

    void loadDashboardData();
   }, [activeTenantId]);

  const locale = i18n.resolvedLanguage?.startsWith("ur") ? "ur-PK" : "en-PK";
  const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString(locale, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "-";

  const CHART_COLORS = {
    primary: "#0D9488", primaryDark: "#0F766E", teal2: "#14B8A6", teal3: "#5EEAD4", teal4: "#0F766E", teal5: "#115E59", teal6: "#99F6E4",
    dark: "#1f4792", grid: "#EAEDF2", tick: "#6B7686",
  };
  const fontFamily = "Inter, sans-serif";

  const barChartData = {
    labels: dailySales.map((day) => new Date(`${day.date}T12:00:00`).toLocaleDateString(locale, { weekday: "short" })),
    datasets: [{ label: t("dashboard.sales"), data: dailySales.map((d) => d.total), backgroundColor: CHART_COLORS.primary, borderRadius: 6, maxBarThickness: 34 }],
  };
  const barChartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => `Rs ${ctx.parsed.y.toLocaleString()}` } } },
    scales: { x: { grid: { display: false }, ticks: { font: { family: fontFamily } } }, y: { beginAtZero: true, grid: { color: CHART_COLORS.grid }, ticks: { font: { family: fontFamily } } } },
  };

  const doughnutChartData = {
    labels: categorySales.map((category) => category.name || t("dashboard.uncategorized")),
    datasets: [{ data: categorySales.map((c) => c.value), backgroundColor: [CHART_COLORS.primary, CHART_COLORS.teal2, CHART_COLORS.teal3, CHART_COLORS.teal4, CHART_COLORS.teal5, CHART_COLORS.teal6], borderWidth: 2, borderColor: "#fff" }],
  };
  const doughnutChartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "right", labels: { usePointStyle: true, boxWidth: 8, font: { family: fontFamily } } } }, cutout: "65%" };

  const lineChartData = {
    labels: dailySales.map((day) => new Date(`${day.date}T12:00:00`).toLocaleDateString(locale, { weekday: "short" })),
    datasets: [{ label: t("dashboard.orders"), data: dailySales.map((d) => d.count), borderColor: CHART_COLORS.primaryDark, backgroundColor: `${CHART_COLORS.primary}1E`, fill: true, tension: 0.4, pointRadius: 4 }],
  };
  const lineChartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, ticks: { font: { family: fontFamily } } }, y: { beginAtZero: true, grid: { color: CHART_COLORS.grid }, ticks: { stepSize: 1, font: { family: fontFamily } } } } };

  return (
    <div className="dashboard">
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
    <h1 style={{ margin: 0, fontSize: "24px", fontWeight: 700 }}>Dashboard</h1>
    <SyncStatusPill />  {/* ✅ Shows sync progress */}
  </div>
      
      {/* 1. Hero Section */}
      {isLoadingStats ? (
        <div className="hero-card" style={{ height: "120px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <DataLoader size="large" message={t("dashboard.loading") || "Loading summary..."} />
        </div>
      ) : (
        <div className="hero-card">
          <div className="hero-metric" onClick={() => navigate("/sales")}>
            <span className="hero-label"><TrendingUp size={16} /> {t("dashboard.todaySales")}</span>
            <span className="hero-value sales">{formatCurrency(stats.todaySales)}</span>
          </div>
          <div className="hero-metric" onClick={() => navigate("/khata")}>
            <span className="hero-label"><Wallet size={16} /> {t("dashboard.udhaarPending")}</span>
            <span className="hero-value udhaar">{formatCurrency(stats.totalUdhaar)}</span>
          </div>
          <div className="hero-metric" onClick={() => navigate("/purchases")}>
            <span className="hero-label"><TrendingDown size={16} /> {t("dashboard.todayPurchases")}</span>
            <span className="hero-value">{formatCurrency(stats.todayPurchases)}</span>
          </div>
        </div>
      )}

      {/* 2. Metrics Strip */}
      {isLoadingStats ? (
        <div className="metric-strip" style={{ height: "78px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <DataLoader size="medium" message="Counting records..." />
        </div>
      ) : (
        <div className="metric-strip">
          <MetricItem icon={Package} value={stats.totalProducts} label={t("dashboard.products")} onClick={() => navigate("/products")} />
          <MetricItem icon={Users} value={stats.totalCustomers} label={t("dashboard.customers")} onClick={() => navigate("/customers")} />
          <MetricItem icon={ShoppingBag} value={stats.totalSales} label={t("dashboard.completedSales")} onClick={() => navigate("/sales")} />
          <MetricItem icon={Clock} value={stats.pendingOrders} label={t("dashboard.heldSales")} onClick={() => navigate("/sales")} variant="warning" />
          <MetricItem icon={AlertTriangle} value={stats.lowStockCount} label={t("dashboard.lowStockShort")} onClick={() => navigate("/products")} variant="danger" />
        </div>
      )}

      {/* 3. Charts Section */}
      <div className="dashboard-charts">
        <div className="chart-card">
          <h3><BarChart3 size={18} strokeWidth={2} /> {t("dashboard.dailySales")}</h3>
          <div className="chart-container" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            {isLoadingCharts ? <DataLoader size="medium" message="Generating chart..." /> : <Bar data={barChartData} options={barChartOptions} />}
          </div>
        </div>

        <div className="chart-card">
          <h3><PieChart size={18} strokeWidth={2} /> {t("dashboard.salesCategory")}</h3>
          <div className="chart-container" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            {isLoadingCharts ? (
               <DataLoader size="medium" message="Loading categories..." />
            ) : categorySales.length > 0 ? (
               <Doughnut data={doughnutChartData} options={doughnutChartOptions} />
            ) : (
               <EmptyState title={t("dashboard.noData")} compact />
            )}
          </div>
        </div>
      </div>

      {/* 4. Orders Trend */}
      <div className="chart-card full-width">
        <h3><TrendingUp size={18} strokeWidth={2} /> {t("dashboard.ordersTrend")}</h3>
        <div className="chart-container" style={{ height: "220px", minHeight: "220px", display: "flex", justifyContent: "center", alignItems: "center" }}>
          {isLoadingCharts ? <DataLoader size="medium" message="Plotting trend..." /> : <Line data={lineChartData} options={lineChartOptions} />}
        </div>
      </div>

      {/* 5. Bottom Grid */}
      <div className="dashboard-grid">
        
        {/* Recent Sales */}
        <div className="card">
          <div className="card-header">
            <h3><ShoppingCart size={18} strokeWidth={2} /> {t("dashboard.recentSales")}</h3>
            <button className="btn btn-sm btn-outline" onClick={() => navigate("/sales")}>{t("dashboard.viewAll")} <ChevronRight size={14} /></button>
          </div>
          <div className="card-body">
            {isLoadingLists ? (
               <DataLoader card={true} message="Fetching recent sales..." size="small" />
            ) : recentSales.length === 0 ? (
               <EmptyState title={t("dashboard.noRecentSales")} compact />
            ) : (
              <div className="recent-list">
                {recentSales.map((sale, index) => (
                  <div key={index} className="recent-item" onClick={() => navigate("/sales")}>
                    <div className="recent-item-info">
                      <span className="recent-item-title">{sale.invoiceNumber}</span>
                      <span className="recent-item-subtitle">{sale.customerName || t("dashboard.walkIn")} · {formatDate(sale.saleDate)}</span>
                    </div>
                    <div className="recent-item-right">
                      <span className="recent-item-amount">{formatCurrency(sale.total)}</span>
                      <StatusBadge status={sale.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="card">
          <div className="card-header">
            <h3><AlertTriangle size={18} strokeWidth={2} /> {t("dashboard.lowStock")}</h3>
            <button className="btn btn-sm btn-outline" onClick={() => navigate("/products")}>{t("dashboard.viewAll")} <ChevronRight size={14} /></button>
          </div>
          <div className="card-body">
            {isLoadingLists ? (
               <DataLoader card={true} message="Checking stock levels..." size="small" />
            ) : lowStockItems.length === 0 ? (
               <EmptyState title={t("dashboard.allStocked")} compact />
            ) : (
              <div className="recent-list">
                {lowStockItems.map((item, index) => (
                  <div key={index} className="recent-item">
                    <div className="recent-item-info">
                      <span className="recent-item-title">{item.name}</span>
                      <span className="recent-item-subtitle">{item.code}</span>
                    </div>
                    <div className="recent-item-right">
                      <span className={`stock-badge ${item.currentStock <= 0 ? "out-of-stock" : "low-stock"}`}>
                        {item.currentStock <= 0 ? t("dashboard.outOfStock") : `${item.currentStock} / ${item.minimumStock}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default Dashboard;