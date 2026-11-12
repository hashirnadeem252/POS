import { useState, useEffect } from "react";
import { UserPlus, Shield, UserX, UserCheck, X } from "lucide-react";
import { getUsers, createUser, toggleUserActive } from "../services/UserDefinition/userService";
import { notify } from "../utils/notify";
import { useAuth } from "../hooks/auth/useAuth";

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [form, setForm] = useState({ fullName: "", username: "", password: "", roleName: "Cashier" });

  const loadUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data || []);
    } catch (err) {
      notify.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createUser(form);
      notify.success("Staff member added");
      setIsModalOpen(false);
      setForm({ fullName: "", username: "", password: "", roleName: "Cashier" });
      loadUsers();
    } catch (err) {
      notify.error(err.message || "Failed to create user");
    }
  };

  const handleToggle = async (id, name, isActive) => {
    if (!window.confirm(`Are you sure you want to ${isActive ? "deactivate" : "activate"} ${name}?`)) return;
    try {
      await toggleUserActive(id);
      notify.success("User status updated");
      loadUsers();
    } catch (err) {
      notify.error(err.message || "Failed to update status");
    }
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1000px", margin: "0 auto" }}>
      
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, margin: 0 }}>Staff Management</h1>
          <p style={{ color: "var(--color-text-secondary)", margin: "4px 0 0 0" }}>Manage cashiers and admin access.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary" style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <UserPlus size={18} /> Add Staff
        </button>
      </div>

      {/* Users Table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ background: "var(--color-background)", borderBottom: "1px solid var(--color-border-light)" }}>
              <th style={{ padding: "16px", fontSize: "13px", color: "var(--color-text-secondary)", fontWeight: 600 }}>Name</th>
              <th style={{ padding: "16px", fontSize: "13px", color: "var(--color-text-secondary)", fontWeight: 600 }}>Username</th>
              <th style={{ padding: "16px", fontSize: "13px", color: "var(--color-text-secondary)", fontWeight: 600 }}>Role</th>
              <th style={{ padding: "16px", fontSize: "13px", color: "var(--color-text-secondary)", fontWeight: 600 }}>Status</th>
              <th style={{ padding: "16px", fontSize: "13px", color: "var(--color-text-secondary)", fontWeight: 600, textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ padding: "24px", textAlign: "center" }}>Loading...</td></tr>
            ) : users.map((u) => (
              <tr key={u.userId} style={{ borderBottom: "1px solid var(--color-border-light)" }}>
                <td style={{ padding: "16px", fontWeight: 500 }}>{u.fullName}</td>
                <td style={{ padding: "16px", color: "var(--color-text-secondary)" }}>{u.username}</td>
                <td style={{ padding: "16px" }}>
                  <span className={`badge ${u.role === "Admin" ? "badge-primary" : "badge-success"}`} style={{ background: u.role === "Admin" ? "var(--color-primary-soft)" : "#F3F4F6", color: u.role === "Admin" ? "var(--color-primary)" : "#4B5563", padding: "4px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: 600 }}>
                    {u.role}
                  </span>
                </td>
                <td style={{ padding: "16px" }}>
                  <span style={{ color: u.isActive ? "var(--color-success)" : "var(--color-danger)", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 500 }}>
                    {u.isActive ? "● Active" : "○ Inactive"}
                  </span>
                </td>
                <td style={{ padding: "16px", textAlign: "right" }}>
                  {u.userId !== currentUser?.userId && (
                    <button 
                      onClick={() => handleToggle(u.userId, u.fullName, u.isActive)}
                      style={{ background: "transparent", border: "none", cursor: "pointer", color: u.isActive ? "var(--color-danger)" : "var(--color-success)", display: "inline-flex", alignItems: "center", gap: "4px", fontWeight: 600, fontSize: "13px" }}
                    >
                      {u.isActive ? <><UserX size={16} /> Deactivate</> : <><UserCheck size={16} /> Activate</>}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {isModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(18, 32, 58, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" }}>
          <div className="card animate-fade-in" style={{ width: "100%", maxWidth: "400px", position: "relative" }}>
            <button onClick={() => setIsModalOpen(false)} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", cursor: "pointer", color: "var(--color-text-secondary)" }}>
              <X size={20} />
            </button>
            <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "24px" }}>Add New Staff</h2>
            
            <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="auth-field">
                <label className="auth-label">Full Name</label>
                <input className="input" value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} required autoFocus />
              </div>
              <div className="auth-field">
                <label className="auth-label">Username (Login ID)</label>
                <input className="input" value={form.username} onChange={e => setForm({...form, username: e.target.value})} required />
              </div>
              <div className="auth-field">
                <label className="auth-label">Password / PIN</label>
                <input type="password" className="input" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required placeholder="e.g. 1234" />
              </div>
              <div className="auth-field">
                <label className="auth-label">Role</label>
                <select className="input" value={form.roleName} onChange={e => setForm({...form, roleName: e.target.value})}>
                  <option value="Cashier">Cashier</option>
                  <option value="Admin">Admin (Full Access)</option>
                </select>
              </div>
              
              <button type="submit" className="btn btn-primary" style={{ marginTop: "8px", padding: "12px" }}>
                Create Account
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}