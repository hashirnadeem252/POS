import { useState, useEffect } from "react";
import { UserPlus, Shield, UserX, UserCheck, X, Users as UsersIcon, Search, UserRoundCheck } from "lucide-react";
import { getUsers, createUser, toggleUserActive } from "../services/UserDefinition/userService";
import { notify } from "../utils/notify";
import { useAuth } from "../hooks/auth/useAuth";
import FormInput from "../components/common/FormInput";
import FormSelect from "../components/common/FormSelect";
import "../assets/styles/users/Users.css";
import EmptyState from "../components/common/EmptyState";

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  
  // Form State
  const [form, setForm] = useState({ fullName: "", username: "", password: "", roleName: "Cashier" });

  const loadUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data || []);
    } catch {
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
    const action = isActive ? "deactivate" : "activate";
    if (!window.confirm(`Are you sure you want to ${action} ${name}?`)) return;
    try {
        const response = await toggleUserActive(id);
        notify.success(`User ${action}d successfully`);
        loadUsers();
    } catch (err) {
        // ✅ Show the actual backend message, not a generic one
        const backendMessage = err?.body?.message || err?.message || `Failed to ${action} user`;
        notify.error(backendMessage);
    }
};

  const normalizedSearch = search.trim().toLowerCase();
  const filteredUsers = users.filter((staffMember) =>
    [staffMember.fullName, staffMember.username, staffMember.role]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedSearch))
  );
  const activeUsers = users.filter((staffMember) => staffMember.isActive).length;
  const adminUsers = users.filter((staffMember) => staffMember.role === "Admin").length;
  const roleOptions = [
    { value: "Cashier", label: "Cashier" },
    { value: "Admin", label: "Admin (Full Access)" },
  ];

  return (
    <div className="staff-management">
      <header className="staff-management-header">
        <div className="staff-management-title">
          <span className="staff-management-eyebrow">People & permissions</span>
          <h1>
            <span className="staff-management-title-icon"><UsersIcon size={21} /></span>
            Staff Management
          </h1>
          <p>Manage your team, account access, and staff status.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary staff-add-button">
          <UserPlus size={18} />
          Add Staff
        </button>
      </header>

      <section className="staff-overview" aria-label="Staff overview">
        <article className="staff-overview-card">
          <span className="staff-overview-icon"><UsersIcon size={19} /></span>
          <div>
            <span className="staff-overview-label">Team members</span>
            <strong>{users.length}</strong>
            <small>Registered staff accounts</small>
          </div>
        </article>
        <article className="staff-overview-card">
          <span className="staff-overview-icon staff-overview-icon-green"><UserRoundCheck size={19} /></span>
          <div>
            <span className="staff-overview-label">Active accounts</span>
            <strong>{activeUsers}</strong>
            <small>Currently able to sign in</small>
          </div>
        </article>
        <article className="staff-overview-card">
          <span className="staff-overview-icon staff-overview-icon-purple"><Shield size={19} /></span>
          <div>
            <span className="staff-overview-label">Administrators</span>
            <strong>{adminUsers}</strong>
            <small>Accounts with full access</small>
          </div>
        </article>
      </section>

      <section className="staff-table-card">
        <div className="staff-table-heading">
          <div>
            <h2>Team accounts</h2>
            <p>{filteredUsers.length} {filteredUsers.length === 1 ? "member" : "members"} shown</p>
          </div>
          <div className="staff-table-tools">
            <label className="staff-search">
              <Search size={16} aria-hidden="true" />
              <input
                type="search"
                placeholder="Search staff..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Search staff by name, username, or role"
              />
            </label>
            <span className="staff-total-count"><UsersIcon size={15} /> {users.length} total</span>
          </div>
        </div>

        <div className="staff-table-wrap">
          <table className="staff-table">
            <thead>
              <tr>
                <th>Staff member</th>
                <th>Username</th>
                <th>Role</th>
                <th>Status</th>
                <th className="staff-action-column">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="staff-table-message">Loading staff accounts...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="staff-table-message">
                    <EmptyState
                      icon={<UsersIcon size={32} />}
                      title={users.length ? "No matching staff members" : "No staff accounts yet"}
                      compact
                    />
                  </td>
                </tr>
              ) : filteredUsers.map((staffMember) => {
                const isCurrentUser = staffMember.userId === currentUser?.userId;
                return (
                  <tr key={staffMember.userId}>
                    <td>
                      <div className="staff-member-cell">
                        <span className="staff-avatar">
                          {(staffMember.fullName || "U").trim().charAt(0).toUpperCase()}
                        </span>
                        <div>
                          <strong>{staffMember.fullName || "Unnamed staff member"}</strong>
                          {isCurrentUser && <small>You</small>}
                        </div>
                      </div>
                    </td>
                    <td className="staff-username-cell">{staffMember.username}</td>
                    <td>
                      <span className={`staff-role-badge ${staffMember.role === "Admin" ? "admin" : ""}`}>
                        {staffMember.role === "Admin" && <Shield size={13} />}
                        {staffMember.role}
                      </span>
                    </td>
                    <td>
                      <span className={`staff-status-badge ${staffMember.isActive ? "active" : "inactive"}`}>
                        <span />
                        {staffMember.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="staff-action-column">
                      {!isCurrentUser && (
                        <button
                          onClick={() => handleToggle(staffMember.userId, staffMember.fullName, staffMember.isActive)}
                          className={`staff-toggle-button ${staffMember.isActive ? "deactivate" : "activate"}`}
                        >
                          {staffMember.isActive
                            ? <><UserX size={15} /> Deactivate</>
                            : <><UserCheck size={15} /> Activate</>}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {isModalOpen && (
        <div className="staff-modal-overlay">
          <div
            className="staff-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="staff-modal-title"
          >
            <button onClick={() => setIsModalOpen(false)} className="staff-modal-close" aria-label="Close dialog">
              <X size={20} />
            </button>
            <span className="staff-modal-icon"><UserPlus size={20} /></span>
            <h2 id="staff-modal-title">Add New Staff</h2>
            <p className="staff-modal-description">Create a secure account and choose the right access level.</p>

            <form
              onSubmit={handleCreate}
              className="staff-modal-form"
            >
              <FormInput
                label="Full name"
                name="fullName"
                value={form.fullName}
                onChange={(event) => setForm({ ...form, fullName: event.target.value })}
                required
                autoFocus
              />
              <FormInput
                label="Username (Login ID)"
                name="username"
                value={form.username}
                onChange={(event) => setForm({ ...form, username: event.target.value })}
                required
              />
              <FormInput
                label="Password / PIN"
                name="password"
                type="password"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                placeholder="Enter a secure password or PIN"
                required
              />
              <FormSelect
                label="Role"
                name="roleName"
                value={form.roleName}
                onChange={(event) => setForm({ ...form, roleName: event.target.value })}
                options={roleOptions}
              />

              <button type="submit" className="btn btn-primary staff-create-button">
                Create Account
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}