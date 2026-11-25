// pages/Signup.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Store, Utensils, Check, ArrowRight, ArrowLeft, User, Mail, AtSign, Sparkles } from "lucide-react";
import { useAuth } from "../hooks/auth/useAuth";
import AuthLayout from "../components/auth/AuthLayout";
import AuthInput from "../components/auth/AuthInput";
import PasswordInput from "../components/auth/PasswordInput";
import AuthButton from "../components/auth/AuthButton";
import { notify } from "../utils/notify";
import { useTranslation } from "react-i18next";
import { useSettings } from "../contexts/SettingsContext";

export default function Signup() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { signup } = useAuth();
  const { refreshSettings } = useSettings(); 
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    storeName: "",
    businessType: "Retail",
    fullName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleBusinessSelect = (type) => {
    setForm((prev) => ({ ...prev, businessType: type }));
  };

  const validateStep1 = () => {
    const errs = {};
    if (!form.storeName.trim()) errs.storeName = t("authMore.businessRequired");
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = t("authMore.fullNameRequired");
    if (!form.username.trim()) errs.username = t("authMore.usernameRequired");
    if (!form.email.trim()) errs.email = t("authMore.emailRequired");
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = t("authMore.invalidEmail");
    if (!form.password) errs.password = t("authMore.passwordRequired");
    else if (form.password.length < 6) errs.password = t("authMore.mustSixChars");
    if (form.password !== form.confirmPassword) errs.confirmPassword = t("authMore.passwordsMismatch");
    
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const nextStep = () => {
    if (validateStep1()) setStep(2);
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep2()) return;

    setLoading(true);
    try {
      await signup({
        fullName: form.fullName.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        role: "Admin", 
      });

      // ✅ Save settings
      await fetch("https://localhost:7219/api/Settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("pos_auth_token")}`,
        },
        body: JSON.stringify({
          storeName: form.storeName.trim(),
          businessType: form.businessType,
          currencySymbol: "Rs",
          currencyCode: "PKR",
          defaultTaxRate: 0,
        }),
      });
  await refreshSettings();

      notify.success(t("authMore.welcomeSignup"));
      navigate("/dashboard", { replace: true });
    } catch (error) {
      notify.error(error?.message || t("authMore.setupFailed"));
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────
  // STEPPER UI
  // ─────────────────────────────────────────
  const StepIndicator = () => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", marginBottom: "32px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div style={{
          width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
          background: step === 1 ? "var(--color-primary)" : "rgba(13, 148, 136, 0.1)",
          color: step === 1 ? "#fff" : "var(--color-primary)", fontWeight: 600, fontSize: 13
        }}>
          {step > 1 ? <Check size={14} strokeWidth={3} /> : "1"}
        </div>
        <span style={{ fontSize: "13px", fontWeight: 600, color: step === 1 ? "var(--color-text-primary)" : "var(--color-text-secondary)" }}>{t("authMore.businessStep")}</span>
      </div>
      
      <div style={{ width: 32, height: 2, background: step > 1 ? "var(--color-primary)" : "var(--color-border-light)" }} />

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div style={{
          width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
          background: step === 2 ? "var(--color-primary)" : "var(--color-background)",
          color: step === 2 ? "#fff" : "var(--color-text-secondary)", fontWeight: 600, fontSize: 13,
          border: step === 2 ? "none" : "1px solid var(--color-border)"
        }}>
          2
        </div>
        <span style={{ fontSize: "13px", fontWeight: 600, color: step === 2 ? "var(--color-text-primary)" : "var(--color-text-secondary)" }}>{t("authMore.accountStep")}</span>
      </div>
    </div>
  );

  return (
    <AuthLayout
      title={step === 1 ? t("authMore.setupBusiness") : t("authMore.createAdmin")}
      subtitle={step === 1 ? t("authMore.setupSubtitle") : t("authMore.adminSubtitle")}
    >
      <div style={{ padding: "8px 0" }}>
        <StepIndicator />

        {/* ─────────────────────────────────────
            STEP 1: BUSINESS INFO
        ───────────────────────────────────── */}
        {step === 1 && (
          <div className="animate-fade-in">
            
            <fieldset className="signup-business-fieldset">
              <legend className="signup-business-label">{t("authMore.selectBusiness")}</legend>
              <div className="signup-business-options">
                <button
                  type="button"
                  className={`signup-business-option${form.businessType === "Retail" ? " is-selected" : ""}`}
                  onClick={() => handleBusinessSelect("Retail")}
                  aria-pressed={form.businessType === "Retail"}
                >
                  <span className="signup-business-option-icon"><Store size={24} strokeWidth={1.8} /></span>
                  <span className="signup-business-option-copy">
                    <strong>{t("authMore.retail")}</strong>
                    <span>{t("authMore.retailDescription")}</span>
                  </span>
                  <span className="signup-business-option-check" aria-hidden="true">
                    {form.businessType === "Retail" && <Check size={13} strokeWidth={3} />}
                  </span>
                </button>

                <button
                  type="button"
                  className={`signup-business-option${form.businessType === "Restaurant" ? " is-selected" : ""}`}
                  onClick={() => handleBusinessSelect("Restaurant")}
                  aria-pressed={form.businessType === "Restaurant"}
                >
                  <span className="signup-business-option-icon"><Utensils size={24} strokeWidth={1.8} /></span>
                  <span className="signup-business-option-copy">
                    <strong>{t("authMore.restaurant")}</strong>
                    <span>{t("authMore.restaurantDescription")}</span>
                  </span>
                  <span className="signup-business-option-check" aria-hidden="true">
                    {form.businessType === "Restaurant" && <Check size={13} strokeWidth={3} />}
                  </span>
                </button>
              </div>
            </fieldset>

            <div style={{ marginBottom: "24px" }}>
              <AuthInput
                label={t("authMore.businessName")}
                name="storeName"
                value={form.storeName}
                onChange={handleChange}
                placeholder={t("authMore.businessExample")}
                icon={Store}
                error={errors.storeName}
                autoFocus
                required
              />
            </div>

            <AuthButton type="button" onClick={nextStep}>
              {t("authMore.continueAdmin")}
              <ArrowRight size={16} strokeWidth={2.5} />
            </AuthButton>

            <div className="auth-form-footer">
              <span>{t("authMore.alreadyAccount")}</span>
              <Link to="/login" className="auth-link">{t("authMore.signIn")}</Link>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────
            STEP 2: ADMIN ACCOUNT
        ───────────────────────────────────── */}
        {step === 2 && (
          <form onSubmit={handleFinalSubmit} className="auth-form animate-fade-in" noValidate>
            <AuthInput 
              label={t("authMore.fullName")}
              name="fullName" 
              value={form.fullName} 
              onChange={handleChange} 
              placeholder={t("authMore.nameExample")}
              icon={User} 
              error={errors.fullName} 
              autoFocus
              required 
            />
            
            <div className="auth-form-row">
              <AuthInput 
                label={t("authMore.username")}
                name="username" 
                value={form.username} 
                onChange={handleChange} 
                placeholder={t("authMore.adminUsername")}
                icon={AtSign} 
                error={errors.username} 
                required 
              />
              <AuthInput 
                label={t("authMore.email")}
                type="email" 
                name="email" 
                value={form.email} 
                onChange={handleChange} 
                placeholder="you@example.com" 
                icon={Mail} 
                error={errors.email} 
                required 
              />
            </div>
            
            <PasswordInput 
              label={t("auth.password")}
              name="password" 
              value={form.password} 
              onChange={handleChange} 
              placeholder={t("authMore.passwordLength")}
              error={errors.password} 
              required 
            />
            
            <PasswordInput 
              label={t("authMore.confirmPasswordShort")}
              name="confirmPassword" 
              value={form.confirmPassword} 
              onChange={handleChange} 
              placeholder={t("auth.confirmPasswordPlaceholder")}
              error={errors.confirmPassword} 
              required 
            />

            <AuthButton loading={loading}>
              {t("authMore.launchAccount")}
              <Sparkles size={16} strokeWidth={2.5} />
            </AuthButton>

            <div style={{ display: "flex", justifyContent: "center", marginTop: "12px" }}>
              <button 
                type="button" 
                onClick={() => setStep(1)} 
                style={{ 
                  background: "none", border: "none", color: "var(--color-text-secondary)", 
                  fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 
                }}
              >
                <ArrowLeft size={14} /> {t("authMore.backBusiness")}
              </button>
            </div>
          </form>
        )}
      </div>
    </AuthLayout>
  );
}