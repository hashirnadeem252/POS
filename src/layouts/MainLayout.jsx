// layouts/MainLayout.jsx
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo, useRef } from "react";
import "./MainLayout.css";
import NotificationDropdown from "../components/common/NotificationDropdown";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Barcode,
  List,
  Store,
  Users,
  ShoppingCart,
  ClipboardCheck,
  UserCog,
  Search,
  User,
  ChevronRight,
  ChevronDown,
  LogOut,
  Settings as SettingsIcon,
  ShieldCheck, // <-- Added for Staff/Users
  Wallet, // <-- Added for Wallet
  BarChart3,
} from "lucide-react";
import { useAuth } from "../hooks/auth/useAuth";
import { useSettings } from "../contexts/SettingsContext";
import { notify } from "../utils/notify";

function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { settings } = useSettings();

  const [expandedMenus, setExpandedMenus] = useState({
    products: true,
    configurations: false,
    sales: false,
    purchases: false,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredMenuItems, setFilteredMenuItems] = useState([]);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isAdmin = user?.role === "Admin";

  const menuItems = [
    {
      path: "/dashboard",
      icon: LayoutDashboard,
      label: "Dashboard",
      type: "link",
    },
    {
      icon: ShoppingBag,
      label: "Sales",
      type: "submenu",
      key: "sales",
      children: [
        {
          path: "/pos",
          icon: ShoppingBag,
          label: "Sale & Return",
        },
      ],
    },
    {
      icon: Package,
      label: "Products",
      type: "submenu",
      key: "products",
      children: [
        {
          path: "/products",
          icon: List,
          label: "Product Definition",
        },
        {
          path: "/products/barcode",
          icon: Barcode,
          label: "Barcode Printing",
        },
      ],
    },
    {
      icon: Store,
      label: "Suppliers",
      type: "link",
      path: "/suppliers",
    },
    {
      icon: Users,
      label: "Customers",
      type: "link",
      path: "/customers",
    },
    {
      icon: ShoppingCart,
      label: "Purchase Orders",
      type: "link",
      path: "/purchases",
    },
    {
      icon: ClipboardCheck,
      label: "GRN",
      type: "link",
      path: "/grn",
    },
    {
      icon: UserCog,
      label: "Sales Persons",
      type: "link",
      path: "/salespersons",
    },
    // ADMIN ONLY SECTION
    ...(isAdmin
        ? [
            {
    icon: BarChart3, // Import this from lucide-react
    label: "End of Day",
    type: "link",
    path: "/end-of-day",
  },
          {
            icon: Wallet, // ✅ New Icon
            label: "Udhaar Khata",
            type: "link",
            path: "/khata",
          },
          {
            icon: ShieldCheck, // Using ShieldCheck for Staff
            label: "Staff Management",
            type: "link",
            path: "/users",
          },
          {
            icon: SettingsIcon,
            label: "Store Settings",
            type: "link",
            path: "/settings",
          },
        ]
      : []),
  ];

  const allMenuItems = useMemo(() => {
    return menuItems.flatMap((item) =>
      item.type === "submenu" ? [item, ...item.children] : [item]
    );
  }, [isAdmin]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredMenuItems([]);
      return;
    }
    const query = searchQuery.toLowerCase().trim();
    const results = allMenuItems.filter((item) =>
      item.label.toLowerCase().includes(query)
    );
    setFilteredMenuItems(results);
  }, [searchQuery, allMenuItems]);

  const toggleMenu = (menu) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menu]: !prev[menu],
    }));
  };

  const isActive = (path) => location.pathname === path;
  const isSubmenuActive = (children) =>
    children?.some((child) => location.pathname === child.path);

  const currentTitle =
    allMenuItems.find((item) => item.path === location.pathname)?.label ||
    "Dashboard";

  const handleLogout = async () => {
    setUserMenuOpen(false);
    try {
      await logout();
      notify.success("Signed out");
    } catch {}
    navigate("/login", { replace: true });
  };

  const renderSearchResults = () => {
    if (!searchQuery.trim() || filteredMenuItems.length === 0) return null;
    return (
      <div className="search-results">
        {filteredMenuItems.map((item, index) => {
          const Icon = item.icon;
          return item.path ? (
            <Link
              key={index}
              to={item.path}
              className="search-result-item"
              onClick={() => setSearchQuery("")}
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </Link>
          ) : null;
        })}
      </div>
    );
  };

  const displayName = user?.fullName || user?.username || "User";
  const displayRole = user?.role || "Cashier";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="main-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="logo-mark">R</span>
          <span className="logo-text" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {settings.storeName || "Rova"}
          </span>
        </div>

        <div className="sidebar-search">
          <Search size={15} />
          <input
            type="text"
            placeholder="Search menu..."
            className="sidebar-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setSearchQuery("");
            }}
          />
          {searchQuery && (
            <button
              className="search-clear"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        {renderSearchResults()}

        <nav className="sidebar-nav">
          {menuItems.map((item, index) => {
            if (item.type === "link") {
              const Icon = item.icon;
              return (
                <Link
                  key={index}
                  to={item.path}
                  className={`sidebar-link ${isActive(item.path) ? "active" : ""}`}
                >
                  <span className="link-icon">
                    <Icon size={18} strokeWidth={1.75} />
                  </span>
                  <span className="link-label">{item.label}</span>
                </Link>
              );
            }

            if (item.type === "submenu") {
              const Icon = item.icon;
              const isExpanded = expandedMenus[item.key];
              const hasActiveChild = isSubmenuActive(item.children);

              const submenuItems = item.children || [];
              const shouldHide =
                searchQuery.trim() &&
                !submenuItems.some((child) =>
                  child.label.toLowerCase().includes(searchQuery.toLowerCase())
                ) &&
                !item.label.toLowerCase().includes(searchQuery.toLowerCase());

              if (shouldHide) return null;

              return (
                <div key={index} className="submenu-container">
                  <button
                    type="button"
                    className={`submenu-toggle ${hasActiveChild ? "active" : ""}`}
                    onClick={() => toggleMenu(item.key)}
                    aria-expanded={isExpanded}
                  >
                    <span className="link-icon">
                      <Icon size={18} strokeWidth={1.75} />
                    </span>
                    <span className="link-label">{item.label}</span>
                    <span className={`submenu-arrow ${isExpanded ? "expanded" : ""}`}>
                      <ChevronRight size={14} />
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="submenu-items">
                      {item.children.map((child, childIndex) => {
                        const ChildIcon = child.icon;
                        return (
                          <Link
                            key={childIndex}
                            to={child.path}
                            className={`submenu-link ${isActive(child.path) ? "active" : ""}`}
                            onClick={() => setSearchQuery("")}
                          >
                            <span className="submenu-icon">
                              <ChildIcon size={15} strokeWidth={1.75} />
                            </span>
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }
            return null;
          })}
        </nav>
      </aside>

      <div className="main-content">
        <header className="header">
          <h1 className="header-title">{currentTitle}</h1>

          <div className="header-right">
            <NotificationDropdown />

            <div
              className="user-profile"
              ref={userMenuRef}
              onClick={() => setUserMenuOpen((v) => !v)}
            >
              <span className="user-avatar">
                {initials || <User size={16} />}
              </span>
              <span className="user-name">{displayName}</span>
              <ChevronDown
                size={14}
                strokeWidth={2}
                className={`user-chevron ${userMenuOpen ? "open" : ""}`}
              />

              {userMenuOpen && (
                <div
                  className="user-menu-dropdown"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="user-menu-info">
                    <div className="user-menu-name">{displayName}</div>
                    <div className="user-menu-role">{displayRole}</div>
                  </div>

                  <div className="user-menu-divider" />

                  <button
                    type="button"
                    className="user-menu-item user-menu-logout"
                    onClick={handleLogout}
                  >
                    <LogOut size={15} strokeWidth={2} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default MainLayout;