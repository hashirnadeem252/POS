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
import LoadingSpinner from "../components/common/LoadingSpinner";
import "../assets/styles/Dashboard.css";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement, Filler);

// =========================
// HELPER COMPONENTS
// =========================
const StatusBadge = ({ status }) => {
  const statusMap = {
    Completed: { className: "dot-success", label: "Completed" },
    Draft: { className: "dot-neutral", label: "Draft" },
    Pending: { className: "dot-warning", label: "Pending" },
    Cancelled: { className: "dot-danger", label: "Cancelled" },
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

// =========================
// MAIN DASHBOARD
// =========================
function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  const [stats, setStats] = useState({
    totalProducts: 0, todaySales: 0, todayPurchases: 0, totalCustomers: 0,
    totalSales: 0, pendingOrders: 0, lowStockCount: 0, totalUdhaar: 0
  });
  
  const [recentSales, setRecentSales] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [dailySales, setDailySales] = useState([]);
  const [categorySales, setCategorySales] = useState([]);

  // Helper to ensure timezones don't mess up "Today"
  const getLocalDateString = (date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  useEffect(() => { loadDashboardData(); }, []);

  async function loadDashboardData() {
    setLoading(true);
    try {
      const [sales, products, customers, purchases, khataBalances] = await Promise.all([
        getSales(),
        getProductsFromIndexedDB(),
        getCustomers(),
        getPurchases(),
        api.get("/api/Customers/balances").catch(() => [])
      ]);

      const salesList = sales || [];
      const productList = products || [];
      const todayStr = getLocalDateString(new Date());

      // 1. Calculate Today's Sales
      const todaySales = salesList.filter(
        (s) => getLocalDateString(s.saleDate) === todayStr && s.status?.toLowerCase() === "completed"
      );

      // 2. Calculate Today's Purchases
      const todayPurchases = (purchases || []).filter(
        (p) => getLocalDateString(p.purchaseDate) === todayStr
      );

      // 3. Calculate Low Stock
      const lowStock = productList.filter((p) => p.currentStock <= p.minimumStock && p.currentStock > 0);
      const outOfStock = productList.filter((p) => p.currentStock <= 0);

      // 4. Calculate Udhaar
      const totalUdhaar = khataBalances?.reduce((sum, c) => sum + Number(c.currentBalance || 0), 0) || 0;

      setStats({
        totalProducts: productList.length,
        todaySales: todaySales.reduce((sum, s) => sum + s.total, 0),
        todayPurchases: todayPurchases.reduce((sum, p) => sum + p.total, 0),
        totalCustomers: customers.length,
        totalSales: salesList.filter((s) => s.status?.toLowerCase() === "completed").length,
        pendingOrders: salesList.filter((s) => s.status?.toLowerCase() === "draft" || s.status?.toLowerCase() === "pending").length,
        lowStockCount: lowStock.length + outOfStock.length,
        totalUdhaar: totalUdhaar,
      });

      setRecentSales(salesList.filter((s) => s.status?.toLowerCase() === "completed").sort((a, b) => new Date(b.saleDate) - new Date(a.saleDate)).slice(0, 5));
      setLowStockItems([...outOfStock, ...lowStock].slice(0, 5));

      setDailySales(getLast7DaysSales(salesList));
      setCategorySales(getCategorySales(salesList, productList));
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  }

  function getLast7DaysSales(sales) {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = getLocalDateString(date);
      
      const daySales = sales.filter((s) => getLocalDateString(s.saleDate) === dateStr && s.status?.toLowerCase() === "completed");
      days.push({
        date: date.toLocaleDateString("en-US", { weekday: "short" }),
        total: daySales.reduce((sum, s) => sum + s.total, 0),
        count: daySales.length,
      });
    }
    return days;
  }

  // ✅ Matches Product ID to get the correct Category
  function getCategorySales(sales, products) {
    const categories = {};
    sales.forEach((sale) => {
      if (sale.status?.toLowerCase() !== "completed") return;
      sale.details?.forEach((detail) => {
        const product = products.find(p => p.productId === detail.productId);
        const category = product?.categoryName || "Uncategorized"; 
        
        if (!categories[category]) categories[category] = 0;
        categories[category] += detail.total || 0;
      });
    });
    return Object.entries(categories).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);
  }

  const formatCurrency = (amount) => `Rs ${(amount || 0).toLocaleString("en-PK")}`;
  const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "-";

  // Chart Colors
  const CHART_COLORS = {
    primary: "#0D9488", primaryDark: "#0F766E", teal2: "#14B8A6", teal3: "#5EEAD4", teal4: "#0F766E", teal5: "#115E59", teal6: "#99F6E4",
    dark: "#1f4792", grid: "#EAEDF2", tick: "#6B7686",
  };
  const fontFamily = "Inter, sans-serif";

  const barChartData = {
    labels: dailySales.map((d) => d.date),
    datasets: [{ label: "Sales", data: dailySales.map((d) => d.total), backgroundColor: CHART_COLORS.primary, borderRadius: 6, maxBarThickness: 34 }],
  };
  const barChartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => `Rs ${ctx.parsed.y.toLocaleString()}` } } },
    scales: { x: { grid: { display: false }, ticks: { font: { family: fontFamily } } }, y: { beginAtZero: true, grid: { color: CHART_COLORS.grid }, ticks: { font: { family: fontFamily } } } },
  };

  const doughnutChartData = {
    labels: categorySales.map((c) => c.name),
    datasets: [{ data: categorySales.map((c) => c.value), backgroundColor: [CHART_COLORS.primary, CHART_COLORS.teal2, CHART_COLORS.teal3, CHART_COLORS.teal4, CHART_COLORS.teal5, CHART_COLORS.teal6], borderWidth: 2, borderColor: "#fff" }],
  };
  const doughnutChartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "right", labels: { usePointStyle: true, boxWidth: 8, font: { family: fontFamily } } } }, cutout: "65%" };

  const lineChartData = {
    labels: dailySales.map((d) => d.date),
    datasets: [{ label: "Orders", data: dailySales.map((d) => d.count), borderColor: CHART_COLORS.primaryDark, backgroundColor: `${CHART_COLORS.primary}1E`, fill: true, tension: 0.4, pointRadius: 4 }],
  };
  const lineChartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, ticks: { font: { family: fontFamily } } }, y: { beginAtZero: true, grid: { color: CHART_COLORS.grid }, ticks: { stepSize: 1, font: { family: fontFamily } } } } };

  if (loading) return <LoadingSpinner fullPage={true} message="Loading Dashboard..." size="large" />;

  return (
    <div className="dashboard">
      
      {/* 1. Hero Section (Navy Blue Premium Header) */}
      <div className="hero-card">
        <div className="hero-metric" onClick={() => navigate("/sales")}>
          <span className="hero-label">
            <TrendingUp size={16} /> Today's Sales
          </span>
          <span className="hero-value sales">
            {formatCurrency(stats.todaySales)}
          </span>
        </div>

        <div className="hero-metric" onClick={() => navigate("/khata")}>
          <span className="hero-label">
            <Wallet size={16} /> Udhaar (Credit) Pending
          </span>
          <span className="hero-value udhaar">
            {formatCurrency(stats.totalUdhaar)}
          </span>
        </div>
        
        <div className="hero-metric" onClick={() => navigate("/purchases")}>
          <span className="hero-label">
            <TrendingDown size={16} /> Today's Purchases
          </span>
          <span className="hero-value">
            {formatCurrency(stats.todayPurchases)}
          </span>
        </div>
      </div>

      {/* 2. Metrics Strip */}
      <div className="metric-strip">
        <MetricItem icon={Package} value={stats.totalProducts} label="Products" onClick={() => navigate("/products")} />
        <MetricItem icon={Users} value={stats.totalCustomers} label="Customers" onClick={() => navigate("/customers")} />
        <MetricItem icon={ShoppingBag} value={stats.totalSales} label="Completed Sales" onClick={() => navigate("/sales")} />
        <MetricItem icon={Clock} value={stats.pendingOrders} label="Held Sales" onClick={() => navigate("/sales")} variant="warning" />
        <MetricItem icon={AlertTriangle} value={stats.lowStockCount} label="Low Stock" onClick={() => navigate("/products")} variant="danger" />
      </div>

      {/* 3. Charts Section */}
      <div className="dashboard-charts">
        <div className="chart-card">
          <h3><BarChart3 size={18} strokeWidth={2} /> Daily Sales (Last 7 Days)</h3>
          <div className="chart-container">
            <Bar data={barChartData} options={barChartOptions} />
          </div>
        </div>

        <div className="chart-card">
          <h3><PieChart size={18} strokeWidth={2} /> Sales by Category</h3>
          <div className="chart-container" style={{ display: "flex", justifyContent: "center" }}>
            {categorySales.length > 0 ? <Doughnut data={doughnutChartData} options={doughnutChartOptions} /> : <p className="chart-empty">No data yet</p>}
          </div>
        </div>
      </div>

      {/* 4. Orders Trend (Full Width) */}
      <div className="chart-card full-width">
        <h3><TrendingUp size={18} strokeWidth={2} /> Orders Trend</h3>
        <div className="chart-container" style={{ height: "220px", minHeight: "220px" }}>
          <Line data={lineChartData} options={lineChartOptions} />
        </div>
      </div>

      {/* 5. Bottom Grid (Recent Sales & Low Stock) */}
      <div className="dashboard-grid">
        
        {/* Recent Sales */}
        <div className="card">
          <div className="card-header">
            <h3><ShoppingCart size={18} strokeWidth={2} /> Recent Sales</h3>
            <button className="btn btn-sm btn-outline" onClick={() => navigate("/sales")}>View all <ChevronRight size={14} /></button>
          </div>
          <div className="card-body">
            {recentSales.length === 0 ? <p className="empty-state">No recent sales</p> : (
              <div className="recent-list">
                {recentSales.map((sale, index) => (
                  <div key={index} className="recent-item" onClick={() => navigate("/sales")}>
                    <div className="recent-item-info">
                      <span className="recent-item-title">{sale.invoiceNumber}</span>
                      <span className="recent-item-subtitle">{sale.customerName || "Walk-in"} · {formatDate(sale.saleDate)}</span>
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
            <h3><AlertTriangle size={18} strokeWidth={2} /> Low Stock Alerts</h3>
            <button className="btn btn-sm btn-outline" onClick={() => navigate("/products")}>View all <ChevronRight size={14} /></button>
          </div>
          <div className="card-body">
            {lowStockItems.length === 0 ? <p className="empty-state">All products are well stocked ✅</p> : (
              <div className="recent-list">
                {lowStockItems.map((item, index) => (
                  <div key={index} className="recent-item">
                    <div className="recent-item-info">
                      <span className="recent-item-title">{item.name}</span>
                      <span className="recent-item-subtitle">{item.code}</span>
                    </div>
                    <div className="recent-item-right">
                      <span className={`stock-badge ${item.currentStock <= 0 ? "out-of-stock" : "low-stock"}`}>
                        {item.currentStock <= 0 ? "Out of stock" : `${item.currentStock} / ${item.minimumStock}`}
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