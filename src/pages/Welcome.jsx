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
import "../assets/styles/auth/Auth.css";

export default function Welcome() {
  const { isAuthenticated, loading } = useAuth();

  if (!loading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="welcome-page">
      {/* ── Top Bar ── */}
      <header className="welcome-header">
        <div className="welcome-logo">
          <span className="welcome-logo-mark">PS</span>
          <span className="welcome-logo-name">Rova</span>
        </div>

        <div className="welcome-header-actions">
          <Link to="/login" className="welcome-btn-text">
            Sign in
          </Link>
          <Link to="/signup" className="welcome-btn-primary">
            Get started
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
              Built for modern retail
            </div>

            <h1 className="welcome-title">
              Sell faster.
              <br />
              Grow <span className="welcome-title-accent">smarter.</span>
            </h1>

            <p className="welcome-subtitle">
              A complete point-of-sale system for modern shops — fast billing,
              smart inventory, barcode printing, and real-time insights, all in
              one place.
            </p>

            <div className="welcome-cta">
              <Link to="/signup" className="welcome-cta-primary">
                Start free
                <ArrowRight size={16} strokeWidth={2.5} />
              </Link>
              <Link to="/login" className="welcome-cta-secondary">
                I already have an account
              </Link>
            </div>

            <div className="welcome-trust">
              <ShieldCheck size={15} strokeWidth={2.2} />
              <span>Your data stays private and secure</span>
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
        app.pos-system.com/dashboard
      </span>
    </div>
    <div className="welcome-mockup-body">
      <img
        src="src/assets/images/hero.png"
        alt="Rova Dashboard Preview"
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
        <div className="welcome-features">
          <div className="welcome-feature-card">
            <span className="welcome-feature-icon">
              <ShoppingCart size={22} strokeWidth={1.75} />
            </span>
            <h3>Lightning-fast sales</h3>
            <p>
              Ring up sales in seconds with a snappy, keyboard-friendly POS
              interface.
            </p>
          </div>

          <div className="welcome-feature-card">
            <span className="welcome-feature-icon">
              <Package size={22} strokeWidth={1.75} />
            </span>
            <h3>Smart inventory</h3>
            <p>
              Stock updates automatically with every sale, return, and purchase
              order.
            </p>
          </div>

          <div className="welcome-feature-card">
            <span className="welcome-feature-icon">
              <Barcode size={22} strokeWidth={1.75} />
            </span>
            <h3>Barcode printing</h3>
            <p>
              Generate and print label-perfect barcodes for any product
              instantly.
            </p>
          </div>

          <div className="welcome-feature-card">
            <span className="welcome-feature-icon">
              <BarChart3 size={22} strokeWidth={1.75} />
            </span>
            <h3>Clear insights</h3>
            <p>
              See what's selling, what's not, and where your money goes — at a
              glance.
            </p>
          </div>

          <div className="welcome-feature-card">
            <span className="welcome-feature-icon">
              <Users size={22} strokeWidth={1.75} />
            </span>
            <h3>Multi-user ready</h3>
            <p>
              Assign roles for admins, managers, and cashiers with one simple
              login.
            </p>
          </div>

          <div className="welcome-feature-card welcome-feature-card-accent">
            <span className="welcome-feature-icon">
              <ShieldCheck size={22} strokeWidth={1.75} />
            </span>
            <h3>Enterprise-grade security</h3>
            <p>
              Session-based authentication keeps your business data safe and
              private.
            </p>
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="welcome-footer">
        <span>© {new Date().getFullYear()} Rova. All rights reserved.</span>
      </footer>
    </div>
  );
}