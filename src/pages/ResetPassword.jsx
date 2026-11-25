// pages/ResetPassword.jsx
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, AlertCircle } from "lucide-react";
import AuthLayout from "../components/auth/AuthLayout";
import PasswordInput from "../components/auth/PasswordInput";
import AuthButton from "../components/auth/AuthButton";
import { useTranslation } from "react-i18next";

const API_URL = "https://localhost:7219/api/Auth";

export default function ResetPassword() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // Guard: no token in URL
  if (!token) {
    return (
      <AuthLayout
        title={t("authMore.invalidReset")}
        subtitle={t("authMore.invalidResetSubtitle")}
      >
        <div className="auth-form">
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
              padding: "16px 18px",
              background: "rgba(220, 38, 38, 0.08)",
              border: "1px solid rgba(220, 38, 38, 0.2)",
              borderRadius: "var(--radius-md)",
              fontSize: 14,
              lineHeight: 1.55,
            }}
          >
            <AlertCircle
              size={20}
              strokeWidth={2.2}
              style={{ color: "var(--color-danger)", flexShrink: 0, marginTop: 1 }}
            />
            <div>
              <strong style={{ display: "block", marginBottom: 4 }}>
                {t("authMore.linkInvalid")}
              </strong>
              {t("authMore.requestNewLink")}
            </div>
          </div>
          <div className="auth-form-footer" style={{ marginTop: 8 }}>
            <Link to="/forgot-password" className="auth-link">
              {t("authMore.requestLink")}
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  if (done) {
    return (
      <AuthLayout
        title={t("authMore.passwordUpdated")}
        subtitle={t("authMore.passwordUpdatedSubtitle")}
      >
        <div className="auth-form">
          <div
            style={{
              padding: "16px 18px",
              background: "rgba(5, 150, 105, 0.08)",
              border: "1px solid rgba(5, 150, 105, 0.2)",
              borderRadius: "var(--radius-md)",
              fontSize: 14,
              lineHeight: 1.55,
            }}
          >
            {t("authMore.signInNewPassword")}
          </div>
          <AuthButton
            type="button"
            onClick={() => navigate("/login", { replace: true })}
          >
            {t("authMore.goToSignIn")}
            <ArrowRight size={16} strokeWidth={2.5} />
          </AuthButton>
        </div>
      </AuthLayout>
    );
  }

  const validate = () => {
    const errs = {};
    if (!password) errs.password = t("authMore.passwordRequired");
    else if (password.length < 6) errs.password = t("authMore.passwordMinLength");
    if (!confirm) errs.confirm = t("authMore.confirmPasswordRequired");
    else if (password !== confirm) errs.confirm = t("authMore.passwordsMismatch");
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!validate()) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(json?.message || t("authMore.resetFailed"));
      }

      setDone(true);
    } catch (err) {
      setFormError(err.message || t("authMore.resetFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={t("authMore.newPassword")}
      subtitle={t("authMore.newPasswordSubtitle")}
    >
      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        <PasswordInput
          label={t("authMore.newPasswordLabel")}
          name="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (errors.password) setErrors((p) => ({ ...p, password: "" }));
          }}
          placeholder={t("authMore.passwordLength")}
          error={errors.password}
          autoComplete="new-password"
          required
        />

        <PasswordInput
          label={t("authMore.confirmNewPassword")}
          name="confirm"
          value={confirm}
          onChange={(e) => {
            setConfirm(e.target.value);
            if (errors.confirm) setErrors((p) => ({ ...p, confirm: "" }));
          }}
          placeholder={t("auth.confirmPasswordPlaceholder")}
          error={errors.confirm}
          autoComplete="new-password"
          required
        />

        {formError && (
          <div
            style={{
              padding: "10px 12px",
              background: "rgba(220, 38, 38, 0.08)",
              border: "1px solid rgba(220, 38, 38, 0.2)",
              borderRadius: "var(--radius-md)",
              fontSize: 13,
              color: "var(--color-danger)",
            }}
          >
            {formError}
          </div>
        )}

        <AuthButton loading={loading}>
          {t("authMore.resetPassword")}
          <ArrowRight size={16} strokeWidth={2.5} />
        </AuthButton>

        <div className="auth-form-footer">
          <Link to="/login" className="auth-link">
            {t("authMore.backToSignIn")}
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}