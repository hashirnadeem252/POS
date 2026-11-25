// components/salespersons/SalesPersonForm.jsx
import { useState, useEffect } from "react";
import { Save, X, UserCheck } from "lucide-react";
import { getNextSalesPersonCode, saveSalesPersonCode } from "../../services/indexdb/sequenceService";
import { requireCurrentAuthTenantId } from "../../utils/authTenant"; // ✅ Added
import { notify } from "../../utils/notify";
import FormInput from "../common/FormInput";
import CodeInput from "../common/CodeInput";
import "../../assets/styles/salespersons/SalesPersonForm.css";

function SalesPersonForm({ salesPerson, onClose, onSave }) {
  // =========================
  // STATE
  // =========================
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    phone: "",
    email: "",
    commissionPercentage: 0,
    isActive: true,
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // =========================
  // GENERATE CODE
  // =========================
  const generateSalesPersonCode = async () => {
    setIsGenerating(true);
    try {
      const tenantId = requireCurrentAuthTenantId(); // ✅ Get tenantId
      const code = await getNextSalesPersonCode(tenantId); // ✅ Pass it
      setFormData((prev) => ({ ...prev, code }));
    } catch (error) {
      console.error("Error generating salesperson code:", error);
      const year = new Date().getFullYear().toString().slice(-2);
      const random = Math.floor(1000 + Math.random() * 9000);
      const fallbackCode = `SP-${year}-${random}`;
      setFormData((prev) => ({ ...prev, code: fallbackCode }));
    } finally {
      setIsGenerating(false);
    }
  };

  // =========================
  // LOAD DATA
  // =========================
  useEffect(() => {
    if (salesPerson) {
      setFormData({
        code: salesPerson.code || "",
        name: salesPerson.name || "",
        phone: salesPerson.phone || "",
        email: salesPerson.email || "",
        commissionPercentage: salesPerson.commissionPercentage || 0,
        isActive: salesPerson.isActive ?? true,
      });
      setIsLoading(false);
    } else {
      generateSalesPersonCode();
      setFormData({
        code: "",
        name: "",
        phone: "",
        email: "",
        commissionPercentage: 0,
        isActive: true,
      });
      setIsLoading(false);
    }
  }, [salesPerson]);

  // =========================
  // HANDLE CHANGE
  // =========================
  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  // =========================
  // HANDLE SUBMIT
  // =========================
  async function handleSubmit(event) {
    event.preventDefault();

    if (!formData.code) {
      notify.warning("Sales Person Code is required");
      return;
    }
    if (!formData.name) {
      notify.warning("Sales Person Name is required");
      return;
    }

    if (!salesPerson) {
      try {
        const tenantId = requireCurrentAuthTenantId(); // ✅ Get tenantId
        await saveSalesPersonCode(tenantId); // ✅ Pass it
      } catch (error) {
        console.error("Error saving salesperson code sequence:", error);
      }
    }

    onSave({
      ...formData,
      commissionPercentage: Number(formData.commissionPercentage) || 0,
    });
  }

  const isEditing = !!salesPerson;

  // =========================
  // LOADING STATE
  // =========================
  if (isLoading) {
    return (
      <div className="salesperson-form-container form-page">
        <div className="form-loading">Loading sales person...</div>
      </div>
    );
  }

  // =========================
  // RENDER
  // =========================
  return (
    <div className="salesperson-form-container form-page">
      {/* Header */}
      <div className="form-header">
        <h2>
          <UserCheck size={20} strokeWidth={2} />
          {isEditing ? "Edit Sales Person" : "Add New Sales Person"}
        </h2>
        {isGenerating && (
          <span className="form-header-hint">Generating code...</span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="salesperson-form">
        {/* Row 1: Code, Name */}
        <div className="form-row">
          <CodeInput
            label="Code"
            name="code"
            value={formData.code}
            onChange={handleChange}
            onGenerate={generateSalesPersonCode}
            canGenerate={!isEditing}
            isGenerating={isGenerating}
            disabled={isEditing}
            required
            placeholder="Auto-generated"
            helper={
              isEditing
                ? "Code locked in edit mode"
                : "Auto-generated or click refresh to regenerate"
            }
          />

          <FormInput
            label="Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter sales person name"
            required
          />
        </div>

        {/* Row 2: Phone, Email */}
        <div className="form-row">
          <FormInput
            label="Phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Enter phone number"
          />

          <FormInput
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="salesperson@example.com"
          />
        </div>

        {/* Row 3: Commission %, Active */}
        <div className="form-row">
          <FormInput
            label="Commission Percentage"
            name="commissionPercentage"
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={formData.commissionPercentage}
            onChange={handleChange}
            placeholder="0.00"
            helper="Commission earned per sale (%)"
          />

          <div className="form-field">
            <label className="form-label">Status</label>
            <label className="form-checkbox">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
              />
              <span>Active</span>
            </label>
            <span className="form-helper">
              Inactive sales persons are hidden from POS screens
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="form-actions">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            <X size={16} strokeWidth={2} />
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            <Save size={16} strokeWidth={2} />
            {isEditing ? "Update Sales Person" : "Save Sales Person"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default SalesPersonForm;