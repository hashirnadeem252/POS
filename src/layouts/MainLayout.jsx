// layouts/MainLayout.jsx
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import "./MainLayout.css";
import NotificationDropdown from "../components/common/NotificationDropdown";
import BrandLogo from "../components/common/BrandLogo";
import MasterDataSyncStatus from "../components/common/MasterDataSyncStatus"; // ✅ Restored
import PageBreadcrumbs from "../components/common/PageBreadcrumbs";
import LanguageToggle from "../components/common/LanguageToggle";
import EmptyState from "../components/common/EmptyState";
import TrialBanner from "../components/common/TrialBanner";
import {
  getBreadcrumbsForPath,
  setBreadcrumbs,
} from "../store/breadcrumbSlice";
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
  Menu,
  X,
  LogOut,
  Settings as SettingsIcon,
  ShieldCheck,
  Wallet,
  BarChart3,
} from "lucide-react";
import { useAuth } from "../hooks/auth/useAuth";
import { notify } from "../utils/notify";
import { useTranslation } from "react-i18next";

function MainLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, logout } = useAuth();
  
  const [expandedMenus, setExpandedMenus] = useState({
    products: false,
    configurations: false,
    sales: false,
    purchases: false,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearchIndex, setActiveSearchIndex] = useState(0);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const userMenuRef = useRef(null);
  const menuSearchRef = useRef(null);

  useEffect(() => {
    dispatch(setBreadcrumbs(getBreadcrumbsForPath(location.pathname)));
  }, [dispatch, location.pathname]);

  useEffect(() => {
    if (!mobileNavOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setMobileNavOpen(false);
    };
    const handleResize = () => {
      if (window.innerWidth > 768) setMobileNavOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleResize);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
    };
  }, [mobileNavOpen]);

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
      label: t("sidebar.dashboard"),
      type: "link",
    },
    {
      icon: ShoppingBag,
      label: t("pos.sales"),
      type: "submenu",
      key: "sales",
      children: [
        {
          path: "/pos",
          icon: ShoppingBag,
          label: t("sidebar.pos"),
        },
      ],
    },
    {
      icon: Package,
      label: t("sidebar.products"),
      type: "submenu",
      key: "products",
      children: [
        {
          path: "/products",
          icon: List,
          label: t("sidebar.productDefinition"),
        },
        {
          path: "/products/barcode",
          icon: Barcode,
          label: t("sidebar.barcode"),
        },
      ],
    },
    {
      icon: Store,
      label: t("sidebar.suppliers"),
      type: "link",
      path: "/suppliers",
    },
    {
      icon: Users,
      label: t("sidebar.customers"),
      type: "link",
      path: "/customers",
    },
    {
      icon: ShoppingCart,
      label: t("sidebar.purchases"),
      type: "link",
      path: "/purchases",
    },
    {
      icon: ClipboardCheck,
      label: t("sidebar.grn"),
      type: "link",
      path: "/grn",
    },
    {
      icon: UserCog,
      label: t("sidebar.salespersons"),
      type: "link",
      path: "/salespersons",
    },
    // ADMIN ONLY SECTION
    ...(isAdmin
      ? [
          {
            icon: BarChart3,
            label: t("sidebar.endOfDay"),
            type: "link",
            path: "/end-of-day",
          },
          {
            icon: Wallet,
            label: t("sidebar.khata"),
            type: "link",
            path: "/khata",
          },
          {
            icon: ShieldCheck,
            label: t("sidebar.users"),
            type: "link",
            path: "/users",
          },
          {
            icon: SettingsIcon,
            label: t("sidebar.settings"),
            type: "link",
            path: "/settings",
          },
        ]
      : []),
  ];

  const allMenuItems = menuItems.flatMap((item) =>
    item.type === "submenu"
      ? item.children.map((child) => ({ ...child, category: item.label }))
      : [item]
  );
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredMenuItems = normalizedSearch
    ? allMenuItems.filter((item) =>
        `${item.label} ${item.category || ""}`.toLowerCase().includes(normalizedSearch)
      )
    : [];

  const toggleMenu = (menu) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menu]: !prev[menu],
    }));
  };

  const isActive = (path) => location.pathname === path;
  const isSubmenuActive = (children) =>
    children?.some((child) => location.pathname === child.path);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    try {
      await logout();
      notify.success(t("sidebar.signedOut"));
    } catch {
      notify.error(t("sidebar.signOutFailed"));
    }
    navigate("/login", {
      replace: true,
      state: { accountSwitch: true },
    });
  };

  const renderSearchResults = () => {
    if (!searchQuery.trim()) return null;

    if (filteredMenuItems.length === 0) {
      return <EmptyState title={t("sidebar.noMenuItems")} compact />;
    }

    return (
      <div className="search-results" role="list">
        {filteredMenuItems.map((item, index) => {
          const Icon = item.icon;
          const resultId = `sidebar-search-result-${index}`;
          return item.path ? (
            <Link
              key={item.path}
              id={resultId}
              to={item.path}
              className={`search-result-item ${index === activeSearchIndex ? "keyboard-active" : ""}`}
              role="listitem"
              onClick={() => {
                setSearchQuery("");
                setActiveSearchIndex(0);
                setMobileNavOpen(false);
              }}
              onMouseEnter={() => setActiveSearchIndex(index)}
            >
              <Icon size={16} />
              <span className="search-result-copy">
                <span>{item.label}</span>
                {item.category && <small>{item.category}</small>}
              </span>
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
      <aside
        id="app-sidebar"
        className={`sidebar ${mobileNavOpen ? "sidebar-open" : ""}`}
      >
        <div className="sidebar-logo">
          <BrandLogo variant="sidebar" />
          <button
            type="button"
            className="sidebar-close"
            onClick={() => setMobileNavOpen(false)}
            aria-label={t("sidebar.closeMenu")}
          >
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-search">
          <Search size={15} />
          <input
            ref={menuSearchRef}
            type="text"
            placeholder={t("sidebar.menuSearch")}
            className="sidebar-search-input"
            aria-label="Search navigation menu"
            aria-controls="sidebar-menu-search-results"
            aria-activedescendant={
              filteredMenuItems[activeSearchIndex]
                ? `sidebar-search-result-${activeSearchIndex}`
                : undefined
            }
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setActiveSearchIndex(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setSearchQuery("");
                setActiveSearchIndex(0);
              } else if (e.key === "ArrowDown" && filteredMenuItems.length > 0) {
                e.preventDefault();
                setActiveSearchIndex((index) => (index + 1) % filteredMenuItems.length);
              } else if (e.key === "ArrowUp" && filteredMenuItems.length > 0) {
                e.preventDefault();
                setActiveSearchIndex((index) => (index - 1 + filteredMenuItems.length) % filteredMenuItems.length);
              } else if (e.key === "Enter" && filteredMenuItems[activeSearchIndex]) {
                e.preventDefault();
                navigate(filteredMenuItems[activeSearchIndex].path);
                setSearchQuery("");
                setActiveSearchIndex(0);
                setMobileNavOpen(false);
              }
            }}
          />
          {searchQuery && (
            <button
              className="search-clear"
              type="button"
              onClick={() => {
                setSearchQuery("");
                setActiveSearchIndex(0);
                menuSearchRef.current?.focus();
              }}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        <nav className="sidebar-nav">
          {searchQuery.trim() ? (
            <div id="sidebar-menu-search-results">{renderSearchResults()}</div>
          ) : (
            menuItems.map((item, index) => {
              if (item.type === "link") {
                const Icon = item.icon;
                return (
                  <Link
                    key={index}
                    to={item.path}
                    className={`sidebar-link ${isActive(item.path) ? "active" : ""}`}
                    onClick={() => setMobileNavOpen(false)}
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
                              onClick={() => {
                                setSearchQuery("");
                                setMobileNavOpen(false);
                              }}
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
            })
          )}
        </nav>
      </aside>
      {mobileNavOpen && (
        <button
          type="button"
          className="sidebar-overlay"
          onClick={() => setMobileNavOpen(false)}
          aria-label={t("sidebar.closeMenu")}
        />
      )}

      <div className="main-content">
        <header className="header">
          <button
            type="button"
            className="mobile-menu-toggle"
            onClick={() => setMobileNavOpen(true)}
            aria-label={t("sidebar.openMenu")}
            aria-controls="app-sidebar"
            aria-expanded={mobileNavOpen}
          >
            <Menu size={21} />
          </button>
          <PageBreadcrumbs />

          <div className="header-right">
            <LanguageToggle />
            
            {/* ✅ Restored the original sync status */}
            <MasterDataSyncStatus />
            
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
                    {t("sidebar.logout")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="content-area">
          <TrialBanner />
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default MainLayout;