// src/pages/CustomersLedger.jsx
import { useState, useEffect } from "react";
import { 
  Wallet, 
  Search, 
  X, 
  CheckCircle2, 
  Users, 
  ArrowDownToLine, 
  CircleDollarSign, 
  Receipt 
} from "lucide-react";
import { api } from "../services/apiClient"; // ✅ Fixed (removed one ../)
import { notify } from "../utils/notify"; // ✅ Fixed
import FormInput from "../components/common/FormInput"; // ✅ Fixed
import { useSettings } from "../contexts/SettingsContext"; // ✅ Fixed
import MonthlyStatementModal from "../components/customers/MonthlyStatementModal"; // ✅ Fixed
import "../assets/styles/customers/CustomersLedger.css"; // ✅ Fixed
import EmptyState from "../components/common/EmptyState"; // ✅ Fixed

export default function CustomersLedger() {
  const { formatCurrency } = useSettings();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // State for Payment Modal
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for Monthly Statement Modal
  const [statementCustomer, setStatementCustomer] = useState(null);

  const loadBalances = async () => {
    try {
      const data = await api.get("/api/Customers/balances");
      setCustomers(data || []);
    } catch {
      notify.error("Failed to load Khata data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadBalances(); }, []);

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!paymentAmount || Number(paymentAmount) <= 0) {
      return notify.warning("Please enter a valid amount");
    }

    setIsSubmitting(true);
    try {
      await api.post("/api/Customers/payments", {
        customerId: selectedCustomer.customerId,
        amount: Number(paymentAmount),
        notes: notes.trim() || "Khata payment"
      });
      notify.success("Payment received successfully!");
      setSelectedCustomer(null);
      setPaymentAmount("");
      setNotes("");
      loadBalances();
    } catch {
      notify.error("Failed to record payment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = customers.filter(c => {
    const searchLower = search.toLowerCase();
    const nameMatch = c.name ? c.name.toLowerCase().includes(searchLower) : false;
    const phoneMatch = c.phone ? c.phone.includes(search) : false;
    return nameMatch || phoneMatch;
  });

  const totalOutstanding = customers.reduce(
    (total, customer) => total + Math.max(Number(customer.currentBalance) || 0, 0),
    0
  );
  const customersWithBalance = customers.filter(
    (customer) => Number(customer.currentBalance) > 0
  ).length;
  const totalCredit = customers.reduce(
    (total, customer) => total + (Number(customer.totalCredit) || 0),
    0
  );

  if (loading) {
    return <div className="customers-ledger-state">Loading Udhaar Khata...</div>;
  }

  return (
    <div className="customers-ledger">
      <header className="customers-ledger-header">
        <div className="customers-ledger-title">
          <span className="customers-ledger-eyebrow">Receivables</span>
          <h1><span className="customers-ledger-title-icon"><Wallet size={21} /></span> Udhaar Khata</h1>
          <p>Track customer balances and record payments.</p>
        </div>
        <div className="customers-ledger-search">
          <Search size={17} aria-hidden="true" />
          <FormInput
            label="Search customers"
            name="customerSearch"
            type="search"
            placeholder="Search by name or phone..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </header>

      <section className="customers-ledger-metrics" aria-label="Khata overview">
        <article className="ledger-metric-card ledger-metric-balance">
          <span className="ledger-metric-icon"><Wallet size={19} /></span>
          <div>
            <span className="ledger-metric-label">Outstanding balance</span>
            <strong>{formatCurrency(totalOutstanding)}</strong>
            <small>Amount currently due</small>
          </div>
        </article>
        <article className="ledger-metric-card">
          <span className="ledger-metric-icon ledger-metric-icon-purple"><Users size={19} /></span>
          <div>
            <span className="ledger-metric-label">Customers with balance</span>
            <strong>{customersWithBalance}</strong>
            <small>Accounts requiring collection</small>
          </div>
        </article>
        <article className="ledger-metric-card">
          <span className="ledger-metric-icon ledger-metric-icon-amber"><CircleDollarSign size={19} /></span>
          <div>
            <span className="ledger-metric-label">Total udhaar issued</span>
            <strong>{formatCurrency(totalCredit)}</strong>
            <small>Lifetime credit sales</small>
          </div>
        </article>
      </section>

      <section className="customers-ledger-table-card">
        <div className="customers-ledger-table-heading">
          <div>
            <h2>Customer accounts</h2>
            <p>{filtered.length} {filtered.length === 1 ? "account" : "accounts"} shown</p>
          </div>
          <span className="customers-ledger-count"><Users size={15} /> {customers.length} total</span>
        </div>

        <div className="customers-ledger-table-wrap">
          <table className="customers-ledger-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Phone</th>
                <th className="ledger-number-cell">Total Udhaar</th>
                <th className="ledger-number-cell">Current Balance</th>
                <th className="ledger-action-cell">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="5" className="customers-ledger-empty">
                    <EmptyState
                      icon={<Search size={32} />}
                      title={customers.length ? "No matching customers" : "No customer balances yet"}
                      compact
                    />
                  </td>
                </tr>
              ) : filtered.map((customer) => {
                const balance = Number(customer.currentBalance) || 0;
                return (
                  <tr key={customer.customerId}>
                    <td>
                      <div className="ledger-customer-name">
                        <span className="ledger-customer-avatar">
                          {(customer.name || "U").trim().charAt(0).toUpperCase()}
                        </span>
                        <strong>{customer.name || "Unnamed Customer"}</strong>
                      </div>
                    </td>
                    <td className="ledger-phone-cell">{customer.phone || "-"}</td>
                    <td className="ledger-number-cell ledger-credit-value">
                      {formatCurrency(Number(customer.totalCredit || 0))}
                    </td>
                    <td className={`ledger-number-cell ${balance > 0 ? "ledger-balance-due" : "ledger-balance-clear"}`}>
                      {formatCurrency(balance)}
                    </td>
                    <td className="ledger-action-cell" style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                      <button
                        onClick={() => setStatementCustomer(customer)}
                        className="btn btn-outline ledger-payment-button"
                        title="View Monthly Khata Statement"
                        style={{ color: "var(--color-primary)", borderColor: "var(--color-primary)" }}
                      >
                        <Receipt size={15} /> View Bill
                      </button>

                      <button
                        onClick={() => setSelectedCustomer(customer)}
                        className="btn btn-primary ledger-payment-button"
                        disabled={balance <= 0}
                      >
                        <ArrowDownToLine size={15} />
                        Receive Payment
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {selectedCustomer && (
        <div className="ledger-payment-overlay" onClick={() => setSelectedCustomer(null)}>
          <div
            onClick={(event) => event.stopPropagation()}
            className="ledger-payment-dialog"
            role="dialog"
            aria-modal="true"
          >
            <button
              onClick={() => setSelectedCustomer(null)}
              className="ledger-modal-close"
              aria-label="Close payment dialog"
            >
              <X size={18} />
            </button>

            <span className="ledger-dialog-icon"><Wallet size={20} /></span>
            <h2>Receive Payment</h2>
            <p className="ledger-dialog-subtitle">Record a payment against this customer account.</p>

            <div className="ledger-payment-customer">
              <span className="ledger-customer-avatar">
                {(selectedCustomer.name || "U").trim().charAt(0).toUpperCase()}
              </span>
              <div>
                <strong>{selectedCustomer.name || "Unnamed Customer"}</strong>
                <span>{selectedCustomer.phone || "No phone number"}</span>
              </div>
              <div className="ledger-dialog-balance">
                <span>Outstanding</span>
                <strong>{formatCurrency(Number(selectedCustomer.currentBalance || 0))}</strong>
              </div>
            </div>

            <form onSubmit={handlePayment} className="ledger-payment-form">
              <FormInput
                label="Amount received (Rs)"
                name="paymentAmount"
                type="number"
                min="0.01"
                max={Number(selectedCustomer.currentBalance) || 0}
                step="0.01"
                value={paymentAmount}
                onChange={(event) => setPaymentAmount(event.target.value)}
                placeholder="0.00"
                required
                autoFocus
              />
              <FormInput
                label="Payment note (optional)"
                name="paymentNotes"
                type="text"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="e.g., Paid via JazzCash"
              />

              <div className="ledger-payment-actions">
                <button type="button" onClick={() => setSelectedCustomer(null)} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="btn btn-primary">
                  <CheckCircle2 size={16} />
                  {isSubmitting ? "Processing..." : "Confirm Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {statementCustomer && (
        <MonthlyStatementModal 
          customer={statementCustomer} 
          onClose={() => setStatementCustomer(null)} 
        />
      )}
    </div>
  );
}