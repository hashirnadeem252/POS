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

export default function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  
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
    if (!form.storeName.trim()) errs.storeName = "Please enter your business name";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = "Full name is required";
    if (!form.username.trim()) errs.username = "Username is required";
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = "Invalid email format";
    if (!form.password) errs.password = "Password is required";
    else if (form.password.length < 6) errs.password = "Must be at least 6 characters";
    if (form.password !== form.confirmPassword) errs.confirmPassword = "Passwords do not match";
    
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

      notify.success("Welcome to Rova! Your business is ready.");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      notify.error(error?.message || "Setup failed. Please try again.");
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
        <span style={{ fontSize: "13px", fontWeight: 600, color: step === 1 ? "var(--color-text-primary)" : "var(--color-text-secondary)" }}>Business</span>
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
        <span style={{ fontSize: "13px", fontWeight: 600, color: step === 2 ? "var(--color-text-primary)" : "var(--color-text-secondary)" }}>Account</span>
      </div>
    </div>
  );

  return (
    <AuthLayout
      title={step === 1 ? "Set up your business" : "Create Admin account"}
      subtitle={step === 1 ? "Tell us about your store to get started." : "You will be the owner of this workspace."}
    >
      <div style={{ padding: "8px 0" }}>
        <StepIndicator />

        {/* ─────────────────────────────────────
            STEP 1: BUSINESS INFO
        ───────────────────────────────────── */}
        {step === 1 && (
          <div className="animate-fade-in">
            
            <label style={{ display: "block", marginBottom: "12px", fontWeight: 600, fontSize: "14px", color: "var(--color-text-primary)" }}>
              Select Business Type
            </label>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
              {/* Retail Card */}
              <div 
                onClick={() => handleBusinessSelect("Retail")}
                style={{
                  border: `2px solid ${form.businessType === "Retail" ? "var(--color-primary)" : "var(--color-border)"}`,
                  borderRadius: "var(--radius-lg)", padding: "20px 16px", textAlign: "center", cursor: "pointer",
                  transition: "var(--transition)", background: form.businessType === "Retail" ? "var(--color-primary-soft)" : "transparent",
                  position: "relative"
                }}
              >
                {form.businessType === "Retail" && (
                  <div style={{ position: "absolute", top: 8, right: 8, background: "var(--color-primary)", borderRadius: "50%", padding: 4 }}>
                    <Check size={10} color="#fff" strokeWidth={3} />
                  </div>
                )}
                <Store size={28} style={{ color: form.businessType === "Retail" ? "var(--color-primary)" : "var(--color-text-secondary)", margin: "0 auto 10px" }} />
                <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: "var(--color-text-primary)" }}>Retail</h3>
              </div>

              {/* Restaurant Card */}
              <div 
                onClick={() => handleBusinessSelect("Restaurant")}
                style={{
                  border: `2px solid ${form.businessType === "Restaurant" ? "var(--color-primary)" : "var(--color-border)"}`,
                  borderRadius: "var(--radius-lg)", padding: "20px 16px", textAlign: "center", cursor: "pointer",
                  transition: "var(--transition)", background: form.businessType === "Restaurant" ? "var(--color-primary-soft)" : "transparent",
                  position: "relative"
                }}
              >
                {form.businessType === "Restaurant" && (
                  <div style={{ position: "absolute", top: 8, right: 8, background: "var(--color-primary)", borderRadius: "50%", padding: 4 }}>
                    <Check size={10} color="#fff" strokeWidth={3} />
                  </div>
                )}
                <Utensils size={28} style={{ color: form.businessType === "Restaurant" ? "var(--color-primary)" : "var(--color-text-secondary)", margin: "0 auto 10px" }} />
                <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: "var(--color-text-primary)" }}>Restaurant</h3>
              </div>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <AuthInput
                label="Business Name"
                name="storeName"
                value={form.storeName}
                onChange={handleChange}
                placeholder="e.g., Ali's Supermarket"
                icon={Store}
                error={errors.storeName}
                autoFocus
                required
              />
            </div>

            <AuthButton type="button" onClick={nextStep}>
              Continue to Admin Setup
              <ArrowRight size={16} strokeWidth={2.5} />
            </AuthButton>

            <div className="auth-form-footer">
              <span>Already have an account?</span>
              <Link to="/login" className="auth-link">Sign in</Link>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────
            STEP 2: ADMIN ACCOUNT
        ───────────────────────────────────── */}
        {step === 2 && (
          <form onSubmit={handleFinalSubmit} className="auth-form animate-fade-in" noValidate>
            <AuthInput 
              label="Full Name" 
              name="fullName" 
              value={form.fullName} 
              onChange={handleChange} 
              placeholder="e.g., Ahmed Khan" 
              icon={User} 
              error={errors.fullName} 
              autoFocus
              required 
            />
            
            <div className="auth-form-row">
              <AuthInput 
                label="Username" 
                name="username" 
                value={form.username} 
                onChange={handleChange} 
                placeholder="Admin username" 
                icon={AtSign} 
                error={errors.username} 
                required 
              />
              <AuthInput 
                label="Email" 
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
              label="Password" 
              name="password" 
              value={form.password} 
              onChange={handleChange} 
              placeholder="At least 6 characters" 
              error={errors.password} 
              required 
            />
            
            <PasswordInput 
              label="Confirm Password" 
              name="confirmPassword" 
              value={form.confirmPassword} 
              onChange={handleChange} 
              placeholder="Re-enter password" 
              error={errors.confirmPassword} 
              required 
            />

            <AuthButton loading={loading}>
              Create Account & Launch
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
                <ArrowLeft size={14} /> Back to Business Info
              </button>
            </div>
          </form>
        )}
      </div>
    </AuthLayout>
  );
}