// pages/Login.jsx
import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { User, ArrowRight } from "lucide-react";
import { useAuth } from "../hooks/auth/useAuth";
import AuthLayout from "../components/auth/AuthLayout";
import AuthInput from "../components/auth/AuthInput";
import PasswordInput from "../components/auth/PasswordInput";
import AuthButton from "../components/auth/AuthButton";
import { notify } from "../utils/notify";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

  const [form, setForm] = useState({ username: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      const dest = location.state?.from?.pathname || "/dashboard";
      navigate(dest, { replace: true });
    }
  }, [isAuthenticated, navigate, location.state]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!form.username.trim()) errs.username = "Username is required";
    if (!form.password) errs.password = "Password is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await login({
        username: form.username.trim(),
        password: form.password,
      });

      notify.success("Welcome back!");
      const dest = location.state?.from?.pathname || "/dashboard";
      navigate(dest, { replace: true });
    } catch (error) {
      console.error("Login failed:", error);
      const msg = error?.message || "Login failed";
      notify.error(msg);

      if (
        msg.toLowerCase().includes("invalid") ||
        msg.toLowerCase().includes("password")
      ) {
        setErrors({ password: "Invalid username or password" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue to your POS dashboard"
    >
      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        <AuthInput
          label="Username"
          name="username"
          value={form.username}
          onChange={handleChange}
          placeholder="Enter your username"
          icon={User}
          error={errors.username}
          autoFocus
          autoComplete="username"
          required
        />

        <PasswordInput
          label="Password"
          name="password"
          value={form.password}
          onChange={handleChange}
          placeholder="Enter your password"
          error={errors.password}
          autoComplete="current-password"
          required
        />

        {/* NEW: Forgot password link */}
        <div style={{ textAlign: "right", marginTop: -4 }}>
          <Link
            to="/forgot-password"
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--color-primary)",
              textDecoration: "none",
            }}
          >
            Forgot password?
          </Link>
        </div>

        <AuthButton loading={loading}>
          Sign In
          <ArrowRight size={16} strokeWidth={2.5} />
        </AuthButton>

        <div className="auth-form-footer">
          <span>Don't have an account?</span>
          <Link to="/signup" className="auth-link">
            Create one
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}