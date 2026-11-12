// components/auth/AuthLayout.jsx
import {
  ShoppingCart,
  Barcode,
  Package,
  BarChart3,
  ShieldCheck,
} from "lucide-react";
import "../../assets/styles/auth/Auth.css";

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="auth-layout">
      {/* Brand panel — left side */}
      <aside className="auth-brand-panel">
        <div className="auth-brand-content">
          <div className="auth-brand-logo">
            <span className="auth-brand-mark">PS</span>
            <span className="auth-brand-name">POS System</span>
          </div>

          <div className="auth-brand-headline">
            <h1>Run your shop, your way.</h1>
            <p>
              A complete point-of-sale system for modern retail — fast, reliable,
              and beautifully simple.
            </p>
          </div>

          <ul className="auth-brand-features">
            <li>
              <span className="feature-icon">
                <ShoppingCart size={18} strokeWidth={2} />
              </span>
              Fast sales & returns
            </li>
            <li>
              <span className="feature-icon">
                <Barcode size={18} strokeWidth={2} />
              </span>
              Barcode printing
            </li>
            <li>
              <span className="feature-icon">
                <Package size={18} strokeWidth={2} />
              </span>
              Inventory tracking
            </li>
            <li>
              <span className="feature-icon">
                <BarChart3 size={18} strokeWidth={2} />
              </span>
              Sales reports
            </li>
            <li>
              <span className="feature-icon">
                <ShieldCheck size={18} strokeWidth={2} />
              </span>
              Secure & reliable
            </li>
          </ul>

          <div className="auth-brand-footer">
            <span>Your trusted POS partner</span>
          </div>
        </div>
      </aside>

      {/* Form panel — right side */}
      <main className="auth-form-panel">
        <div className="auth-form-container">
          <div className="auth-form-header">
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>

          {children}
        </div>
      </main>
    </div>
  );
}