// pages/EndOfDay.jsx
import { useState, useEffect } from "react";
import { Printer, Banknote, CreditCard, Clock, TrendingUp, Wallet, AlertCircle } from "lucide-react";
import { getDailySummary } from "../services/SaleDefinition/saleService";
import { useSettings } from "../contexts/SettingsContext";
import { notify } from "../utils/notify";
import FormInput from "../components/common/FormInput";
import "../assets/styles/reports/EndOfDay.css";

export default function EndOfDay() {
  const { settings, formatCurrency } = useSettings();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openingCash, setOpeningCash] = useState(0);

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      try {
        const data = await getDailySummary(date);
        setSummary(data);
      } catch {
        notify.error("Failed to load summary");
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, [date]);

  if (loading) return <div className="end-of-day-state">Loading daily summary...</div>;
  if (!summary) return null;

  const cashSales = Number(summary.cashSales) || 0;
  const digitalSales = Number(summary.digitalSales) || 0;
  const creditSales = Number(summary.creditSales) || 0;
  const udhaarRecovered = Number(summary.udhaarRecovered) || 0;
  const totalSales = Number(summary.totalSales) || 0;
  const expectedCash = openingCash + cashSales + udhaarRecovered;

  return (
    <div className="end-of-day">
      <header className="end-of-day-header no-print">
        <div className="end-of-day-heading">
          <span className="end-of-day-eyebrow">Daily close</span>
          <h1>End of Day <span>(Z-Report)</span></h1>
          <p>Daily summary for {settings.storeName}</p>
        </div>
        <div className="end-of-day-controls">
          <FormInput
            label="Report date"
            name="reportDate"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="end-of-day-date"
          />
          <button onClick={() => window.print()} className="btn btn-primary end-of-day-print">
            <Printer size={18} />
            Print Report
          </button>
        </div>
      </header>

      <div id="print-area" className="end-of-day-report">
        <div className="print-header">
          <h2>{settings.storeName}</h2>
          <p>{settings.storeAddress}</p>
          <p>Phone: {settings.storePhone}</p>
          <h3>End of Day Report — {new Date(date).toLocaleDateString()}</h3>
        </div>

        <div className="end-of-day-overview">
          <section className="end-of-day-card payment-card">
            <div className="end-of-day-card-heading">
              <span className="end-of-day-card-icon"><Banknote size={18} /></span>
              <div>
                <h2>Payment Breakdown</h2>
                <p>Sales and collections by payment type</p>
              </div>
            </div>

            <div className="end-of-day-rows">
              <div className="end-of-day-row">
                <span><Banknote size={16} /> Cash Sales</span>
                <strong>{formatCurrency(cashSales)}</strong>
              </div>
              <div className="end-of-day-row">
                <span><CreditCard size={16} /> Digital (QR/Card)</span>
                <strong>{formatCurrency(digitalSales)}</strong>
              </div>
              <div className="end-of-day-row">
                <span><Clock size={16} /> Udhaar Given</span>
                <strong className="amount-negative">{formatCurrency(creditSales)}</strong>
              </div>
              <div className="end-of-day-row">
                <span><TrendingUp size={16} /> Udhaar Recovered</span>
                <strong className="amount-positive">+ {formatCurrency(udhaarRecovered)}</strong>
              </div>
            </div>
          </section>

          <section className="end-of-day-card totals-card">
            <div className="end-of-day-card-heading">
              <span className="end-of-day-card-icon"><TrendingUp size={18} /></span>
              <div>
                <h2>Daily Totals</h2>
                <p>At-a-glance performance</p>
              </div>
            </div>

            <div className="end-of-day-total-highlight">
              <span>Total Revenue</span>
              <strong>{formatCurrency(totalSales)}</strong>
            </div>
            <div className="end-of-day-row">
              <span>Total Transactions</span>
              <strong>{summary.totalTransactions}</strong>
            </div>
            <div className="end-of-day-row">
              <span>Total Discounts</span>
              <strong className="amount-warning">{formatCurrency(Number(summary.totalDiscount))}</strong>
            </div>
          </section>
        </div>

        <section className="end-of-day-card reconciliation-card">
          <div className="end-of-day-card-heading">
            <span className="end-of-day-card-icon"><Wallet size={18} /></span>
            <div>
              <h2>Cash Drawer Reconciliation</h2>
              <p>Review the expected register balance before closing</p>
            </div>
          </div>

          <div className="reconciliation-content">
            <div className="reconciliation-breakdown">
              <div className="end-of-day-row">
                <span>Opening Cash</span>
                <strong>{formatCurrency(openingCash)}</strong>
              </div>
              <div className="end-of-day-row">
                <span>Cash Sales</span>
                <strong>+ {formatCurrency(cashSales)}</strong>
              </div>
              <div className="end-of-day-row">
                <span>Udhaar Recovered</span>
                <strong>+ {formatCurrency(udhaarRecovered)}</strong>
              </div>

              <div className="opening-cash-control no-print">
                <FormInput
                  label="Set Opening Cash"
                  name="openingCash"
                  type="number"
                  min="0"
                  step="0.01"
                  value={openingCash}
                  onChange={(event) => setOpeningCash(Number(event.target.value) || 0)}
                />
              </div>
            </div>

            <div className="expected-cash">
              <div className="expected-cash-label">
                <AlertCircle size={16} />
                Expected Cash in Drawer
              </div>
              <strong>{formatCurrency(expectedCash)}</strong>
              <p>Count the physical cash in the register.</p>
            </div>
          </div>
        </section>

        <div className="print-signature">
          <div>Cashier Signature</div>
          <div>Owner Signature</div>
        </div>
      </div>
    </div>
  );
}