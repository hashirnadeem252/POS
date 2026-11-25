import { useEffect, useState } from "react";
import { CreditCard, CheckCircle2, ShieldAlert, Clock } from "lucide-react";
import { useAuth } from "../../hooks/auth/useAuth";
import { api } from "../../services/apiClient";
import DataLoader from "../../components/common/DataLoader";
import { notify } from "../../utils/notify";

export default function SubscriptionBilling() {
  const { subscription } = useAuth();
  const [payments, setPayments] = useState([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(true);
  const [isUpgrading, setIsUpgrading] = useState(false);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await api.get("/api/Subscriptions/payments");
        setPayments(res || []);
      } catch (error) {
        console.error("Failed to load payments", error);
      } finally {
        setIsLoadingPayments(false);
      }
    };
    fetchPayments();
  }, []);

  const handleUpgradeRequest = async () => {
    setIsUpgrading(true);
    try {
      await api.post("/api/Subscriptions/upgrade-request", {});
      notify.success("Upgrade request received. Our team will contact you shortly.");
    } catch (error) {
      notify.error("Failed to submit upgrade request.");
    } finally {
      setIsUpgrading(false);
    }
  };

  if (!subscription) {
    return <DataLoader message="Loading subscription details..." />;
  }

  const isTrial = subscription.status === "Trial";
  const isExpired = subscription.isExpired;
  const daysLeft = subscription.daysRemaining || 0;

  let alertClass = "trial-alert-info";
  let alertText = `You have ${daysLeft} days left in your trial.`;
  if (isExpired) {
    alertClass = "trial-alert-danger";
    alertText = "Your trial has expired. Please upgrade to continue using the POS.";
  } else if (daysLeft <= 7) {
    alertClass = "trial-alert-warning";
    alertText = `Only ${daysLeft} days left! Please upgrade soon.`;
  }

  return (
    <div className="subscription-page">
      <header className="settings-page-header">
        <span className="settings-eyebrow">Billing</span>
        <h1>Subscription & Billing</h1>
        <p>Manage your plan and billing details.</p>
      </header>

      {/* Status Alert */}
      <div className={`trial-alert ${alertClass}`}>
        {isExpired ? <ShieldAlert size={20} /> : daysLeft <= 7 ? <Clock size={20} /> : <CheckCircle2 size={20} />}
        <span>{alertText}</span>
      </div>

      {/* Plan Card */}
      <div className="plan-card">
        <div className="plan-details">
          <h2>Monthly Plan</h2>
          <p>Perfect for growing businesses. Full access to all POS features.</p>
          <div className="plan-price">
            <span className="currency">Rs</span>
            <span className="amount">1,000</span>
            <span className="period">/ month</span>
          </div>
        </div>
        <div className="plan-actions">
          <button 
            className="btn btn-primary" 
            onClick={handleUpgradeRequest}
            disabled={isUpgrading}
          >
            {isUpgrading ? "Processing..." : isExpired ? "Upgrade Now" : "Upgrade Plan"}
          </button>
          <p className="plan-note">
            {isExpired ? "Your trial has ended. Upgrade to restore access." : "Billed monthly. Cancel anytime."}
          </p>
        </div>
      </div>

      {/* Current Subscription Details */}
      <div className="subscription-details-card">
        <h3>Current Subscription</h3>
        <div className="detail-row">
          <span>Status</span>
          <span className={`status-badge ${subscription.status.toLowerCase()}`}>{subscription.status}</span>
        </div>
        <div className="detail-row">
          <span>Start Date</span>
          <span>{new Date(subscription.trialStartDate).toLocaleDateString()}</span>
        </div>
        <div className="detail-row">
          <span>End Date</span>
          <span>{new Date(subscription.trialEndDate).toLocaleDateString()}</span>
        </div>
        <div className="detail-row">
          <span>Remaining Days</span>
          <span className={daysLeft <= 7 ? "text-warning" : ""}>{daysLeft} days</span>
        </div>
      </div>

      {/* Payment History */}
      <div className="payment-history-card">
        <h3>Payment History</h3>
        {isLoadingPayments ? (
          <DataLoader message="Fetching payment history..." />
        ) : payments.length === 0 ? (
          <p className="empty-state">No payment records found.</p>
        ) : (
          <table className="payment-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.paymentId}>
                  <td>{new Date(p.date).toLocaleDateString()}</td>
                  <td>Rs {p.amount}</td>
                  <td>{p.paymentMethod}</td>
                  <td><span className={`badge ${p.status.toLowerCase()}`}>{p.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}