// pages/Welcome.jsx
import { Link, Navigate } from "react-router-dom";
import {
  ShoppingCart,
  Barcode,
  Package,
  BarChart3,
  ArrowRight,
  ShieldCheck,
  Zap,
  Users,
} from "lucide-react";
import { useAuth } from "../hooks/auth/useAuth";
import BrandLogo from "../components/common/BrandLogo";
import LanguageToggle from "../components/common/LanguageToggle";
import heroImage from "../assets/images/hero.png";
import "../assets/styles/auth/Auth.css";
import { useTranslation } from "react-i18next";

export default function Welcome() {
  const { t } = useTranslation();
  const { isAuthenticated, loading } = useAuth();

  if (!loading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="welcome-page">
      {/* ── Top Bar ── */}
      <header className="welcome-header">
        <div className="welcome-logo">
          <BrandLogo variant="full" />
        </div>

        <div className="welcome-header-actions">
          <LanguageToggle />
          <Link to="/login" className="welcome-btn-text">
            {t("landing.signIn")}
          </Link>
          <Link to="/signup" className="welcome-btn-primary">
            {t("landing.getStarted")}
            <ArrowRight size={14} strokeWidth={2.5} />
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <main className="welcome-main">
        <div className="welcome-hero">
          <div className="welcome-hero-inner">
            <div className="welcome-badge">
              <Zap size={13} strokeWidth={2.5} />
              {t("landing.builtForRetail")}
            </div>

            <h1 className="welcome-title">
              {t("landing.sellFaster")}
              <br />
              {t("landing.growSmarter")}
            </h1>

            <p className="welcome-subtitle">
              {t("landing.description")}
            </p>

            <div className="welcome-cta">
              <Link to="/signup" className="welcome-cta-primary">
                {t("landing.startFree")}
                <ArrowRight size={16} strokeWidth={2.5} />
              </Link>
              <Link to="/login" className="welcome-cta-secondary">
                {t("landing.existingAccount")}
              </Link>
            </div>

            <div className="welcome-trust">
              <ShieldCheck size={15} strokeWidth={2.2} />
              <span>{t("landing.privateSecure")}</span>
            </div>
          </div>
          {/* ── Hero Mockup ── */}
          <div className="welcome-mockup">
            <div className="welcome-mockup-glow" />
            <div className="welcome-mockup-frame">
              <div className="welcome-mockup-toolbar">
                <span className="welcome-mockup-dot" />
                <span className="welcome-mockup-dot" />
                <span className="welcome-mockup-dot" />
                <span className="welcome-mockup-url">
                  <ShieldCheck size={11} strokeWidth={2} />
                  SaleKhata <span>{t("landing.workspace")}</span>
                </span>
              </div>
              <div className="welcome-mockup-body">
                <img
                  src={heroImage}
                  alt={t("landing.previewAlt")}
                  className="welcome-mockup-image"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
          {/* Decorative gradient orbs */}
          <div className="welcome-orb welcome-orb-1" />
          <div className="welcome-orb welcome-orb-2" />
          <div className="welcome-orb welcome-orb-3" />
        </div>

        {/* ── Feature Grid ── */}
        <section
          className="welcome-features-section"
          aria-labelledby="welcome-features-title"
        >
          <div className="welcome-features-heading">
            <span className="welcome-section-eyebrow">
              {t("landing.eyebrow")}
            </span>
            <h2 id="welcome-features-title">{t("landing.featuresTitle")}</h2>
            <p>{t("landing.featuresIntro")}</p>
          </div>
          <div className="welcome-features">
            <div className="welcome-feature-card">
              <span className="welcome-feature-icon">
                <ShoppingCart size={22} strokeWidth={1.75} />
              </span>
              <h3>{t("landing.fastSales")}</h3>
              <p>
                {t("landing.fastSalesText")}
              </p>
            </div>

            <div className="welcome-feature-card">
              <span className="welcome-feature-icon">
                <Package size={22} strokeWidth={1.75} />
              </span>
              <h3>{t("landing.inventory")}</h3>
              <p>
                {t("landing.inventoryText")}
              </p>
            </div>

            <div className="welcome-feature-card">
              <span className="welcome-feature-icon">
                <Barcode size={22} strokeWidth={1.75} />
              </span>
              <h3>{t("landing.barcode")}</h3>
              <p>
                {t("landing.barcodeText")}
              </p>
            </div>

            <div className="welcome-feature-card">
              <span className="welcome-feature-icon">
                <BarChart3 size={22} strokeWidth={1.75} />
              </span>
              <h3>{t("landing.insights")}</h3>
              <p>
                {t("landing.insightsText")}
              </p>
            </div>

            <div className="welcome-feature-card">
              <span className="welcome-feature-icon">
                <Users size={22} strokeWidth={1.75} />
              </span>
              <h3>{t("landing.multiUser")}</h3>
              <p>
                {t("landing.multiUserText")}
              </p>
            </div>

            <div className="welcome-feature-card welcome-feature-card-accent">
              <span className="welcome-feature-icon">
                <ShieldCheck size={22} strokeWidth={1.75} />
              </span>
              <h3>{t("landing.security")}</h3>
              <p>
                {t("landing.securityText")}
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="welcome-footer">
        <span>{t("landing.copyright", { year: new Date().getFullYear() })}</span>
      </footer>
    </div>
  );
}