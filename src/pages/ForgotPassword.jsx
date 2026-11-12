// pages/ForgotPassword.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowRight, CheckCircle2 } from "lucide-react";
import AuthLayout from "../components/auth/AuthLayout";
import AuthInput from "../components/auth/AuthInput";
import AuthButton from "../components/auth/AuthButton";

const API_URL = "https://localhost:7219/api/Auth";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("Please enter a valid email");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      // Backend intentionally returns 200 regardless of whether email exists.
      if (!response.ok) {
        const json = await response.json().catch(() => ({}));
        throw new Error(json?.message || "Something went wrong. Try again.");
      }

      setSent(true);
    } catch (err) {
      setError(err.message || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Forgot password"
      subtitle="Enter your email and we'll send you a link to reset it"
    >
      {sent ? (
        <div className="auth-form">
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
              padding: "16px 18px",
              background: "rgba(5, 150, 105, 0.08)",
              border: "1px solid rgba(5, 150, 105, 0.2)",
              borderRadius: "var(--radius-md)",
              color: "var(--color-text-primary)",
              fontSize: 14,
              lineHeight: 1.55,
            }}
          >
            <CheckCircle2
              size={20}
              strokeWidth={2.2}
              style={{ color: "var(--color-success)", flexShrink: 0, marginTop: 1 }}
            />
            <div>
              <strong style={{ display: "block", marginBottom: 4 }}>
                Check your inbox
              </strong>
              If an account exists for <strong>{email}</strong>, you'll receive a
              password reset link shortly. The link expires in 30 minutes.
            </div>
          </div>

          <div className="auth-form-footer" style={{ marginTop: 8 }}>
            <Link to="/login" className="auth-link">
              Back to sign in
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <AuthInput
            label="Email address"
            name="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError("");
            }}
            placeholder="you@example.com"
            icon={Mail}
            error={error}
            autoFocus
            autoComplete="email"
            required
          />

          <AuthButton loading={loading}>
            Send Reset Link
            <ArrowRight size={16} strokeWidth={2.5} />
          </AuthButton>

          <div className="auth-form-footer">
            <span>Remember your password?</span>
            <Link to="/login" className="auth-link">
              Sign in
            </Link>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}