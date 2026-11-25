// components/auth/AuthLayout.jsx
import {
  ShoppingCart,
  Barcode,
  Package,
  BarChart3,
  ShieldCheck,
} from "lucide-react";
import BrandLogo from "../common/BrandLogo";
import LanguageToggle from "../common/LanguageToggle";
import "../../assets/styles/auth/Auth.css";
import { useTranslation } from "react-i18next";

export default function AuthLayout({ children, title, subtitle }) {
  const { t } = useTranslation();

  return (
    <div className="auth-layout">
      {/* Brand panel — left side */}
      <aside className="auth-brand-panel">
        <div className="auth-brand-content">
          <div className="auth-brand-logo">
            <BrandLogo variant="auth" />
          </div>

          <div className="auth-brand-headline">
            <h1>{t("authMore.runShop")}</h1>
            <p>
              {t("authMore.authDescription")}
            </p>
          </div>

          <ul className="auth-brand-features">
            <li>
              <span className="feature-icon">
                <ShoppingCart size={18} strokeWidth={2} />
              </span>
              {t("authMore.fastSales")}
            </li>
            <li>
              <span className="feature-icon">
                <Barcode size={18} strokeWidth={2} />
              </span>
              {t("authMore.barcodePrinting")}
            </li>
            <li>
              <span className="feature-icon">
                <Package size={18} strokeWidth={2} />
              </span>
              {t("authMore.inventoryTracking")}
            </li>
            <li>
              <span className="feature-icon">
                <BarChart3 size={18} strokeWidth={2} />
              </span>
              {t("authMore.salesReports")}
            </li>
            <li>
              <span className="feature-icon">
                <ShieldCheck size={18} strokeWidth={2} />
              </span>
              {t("authMore.secureReliable")}
            </li>
          </ul>

          <div className="auth-brand-footer">
            <span>{t("authMore.trustedPartner")}</span>
          </div>
        </div>
      </aside>

      {/* Form panel — right side */}
      <main className="auth-form-panel">
        <div className="auth-form-container">
        <div className="auth-language-row">
          <LanguageToggle />
        </div>
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