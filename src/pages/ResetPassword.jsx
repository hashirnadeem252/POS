// pages/ResetPassword.jsx
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, AlertCircle } from "lucide-react";
import AuthLayout from "../components/auth/AuthLayout";
import PasswordInput from "../components/auth/PasswordInput";
import AuthButton from "../components/auth/AuthButton";

const API_URL = "https://localhost:7219/api/Auth";

export default function ResetPassword() {
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
        title="Invalid reset link"
        subtitle="This password reset link is missing or malformed"
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
                Link is invalid
              </strong>
              Please request a new password reset link.
            </div>
          </div>
          <div className="auth-form-footer" style={{ marginTop: 8 }}>
            <Link to="/forgot-password" className="auth-link">
              Request a new link
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  if (done) {
    return (
      <AuthLayout
        title="Password updated"
        subtitle="Your password has been reset successfully"
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
            You can now sign in with your new password.
          </div>
          <AuthButton
            type="button"
            onClick={() => navigate("/login", { replace: true })}
          >
            Go to sign in
            <ArrowRight size={16} strokeWidth={2.5} />
          </AuthButton>
        </div>
      </AuthLayout>
    );
  }

  const validate = () => {
    const errs = {};
    if (!password) errs.password = "Password is required";
    else if (password.length < 6) errs.password = "Password must be at least 6 characters";
    if (!confirm) errs.confirm = "Please confirm your password";
    else if (password !== confirm) errs.confirm = "Passwords do not match";
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
        throw new Error(json?.message || "Failed to reset password");
      }

      setDone(true);
    } catch (err) {
      setFormError(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Set a new password"
      subtitle="Choose a strong password you haven't used before"
    >
      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        <PasswordInput
          label="New password"
          name="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (errors.password) setErrors((p) => ({ ...p, password: "" }));
          }}
          placeholder="At least 6 characters"
          error={errors.password}
          autoComplete="new-password"
          required
        />

        <PasswordInput
          label="Confirm new password"
          name="confirm"
          value={confirm}
          onChange={(e) => {
            setConfirm(e.target.value);
            if (errors.confirm) setErrors((p) => ({ ...p, confirm: "" }));
          }}
          placeholder="Re-enter your password"
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
          Reset Password
          <ArrowRight size={16} strokeWidth={2.5} />
        </AuthButton>

        <div className="auth-form-footer">
          <Link to="/login" className="auth-link">
            Back to sign in
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}