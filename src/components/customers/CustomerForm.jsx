  // components/customers/CustomerForm.jsx
  import { useState, useEffect } from "react";
  import { Save, X, User } from "lucide-react";
  import { getNextCustomerCode, saveCustomerCode } from "../../services/indexdb/sequenceService";
  import { requireCurrentAuthTenantId } from "../../utils/authTenant"; 
  import { notify } from "../../utils/notify";
  import FormInput from "../common/FormInput";
  import FormTextarea from "../common/FormTextarea";
  import CodeInput from "../common/CodeInput";
  import "../../assets/styles/customers/CustomerForm.css";

function CustomerForm({ customer, onClose, onSave }) {
    // =========================
    // STATE
    // =========================
    const [formData, setFormData] = useState({
      code: "",
      name: "",
      phone: "",
      email: "",
      address: "",
      city: "",
      taxNumber: "",
      openingBalance: "",
      isActive: true,
    });

    const [isGenerating, setIsGenerating] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

  // =========================
  // GENERATE CUSTOMER CODE
  // =========================
  const generateCustomerCode = async () => {
    setIsGenerating(true);
    try {
      const tenantId = requireCurrentAuthTenantId(); // ✅ Get tenantId
      const code = await getNextCustomerCode(tenantId); // ✅ Pass it
      setFormData((prev) => ({ ...prev, code }));
    } catch (error) {
      console.error("Error generating customer code:", error);
      const year = new Date().getFullYear().toString().slice(-2);
      const random = Math.floor(1000 + Math.random() * 9000);
      const fallbackCode = `CUS-${year}-${random}`;
      setFormData((prev) => ({ ...prev, code: fallbackCode }));
    } finally {
      setIsGenerating(false);
    }
  };

    // =========================
    // LOAD CUSTOMER DATA OR GENERATE CODE
    // =========================
    useEffect(() => {
      if (customer) {
        setFormData({
          code: customer.code || "",
          name: customer.name || "",
          phone: customer.phone || "",
          email: customer.email || "",
          address: customer.address || "",
          city: customer.city || "",
          taxNumber: customer.taxNumber || "",
          openingBalance: customer.openingBalance ?? "",
          isActive: customer.isActive ?? true,
        });
        setIsLoading(false);
      } else {
        generateCustomerCode();
        setFormData({
          code: "",
          name: "",
          phone: "",
          email: "",
          address: "",
          city: "",
          taxNumber: "",
          openingBalance: "",
          isActive: true,
        });
        setIsLoading(false);
      }
    }, [customer]);

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

      if (!formData.code || formData.code.trim() === "") {
        notify.warning("Customer Code is required");
        return;
      }
      if (!formData.name || formData.name.trim() === "") {
        notify.warning("Customer Name is required");
        return;
      }

         if (!customer) {
      try {
        const tenantId = requireCurrentAuthTenantId(); // ✅ Get tenantId
        await saveCustomerCode(tenantId); // ✅ Pass it
      } catch (error) {
        console.error("Error saving customer code sequence:", error);
      }
    }
      const cleanedData = {
        code: formData.code.trim(),
        name: formData.name.trim(),
        phone: formData.phone?.trim() || null,
        email: formData.email?.trim() || null,
        address: formData.address?.trim() || null,
        city: formData.city?.trim() || null,
        taxNumber: formData.taxNumber?.trim() || null,
        openingBalance: Number(formData.openingBalance) || 0,
        isActive: formData.isActive ?? true,
      };

      onSave(cleanedData);
    }

    const isEditing = !!customer;

    // =========================
    // LOADING STATE
    // =========================
    if (isLoading) {
      return (
        <div className="customer-form-container form-page">
          <div className="form-loading">Loading customer...</div>
        </div>
      );
    }

    // =========================
    // RENDER
    // =========================
    return (
      <div className="customer-form-container form-page">
        {/* Header */}
        <div className="form-header">
          <h2>
            <User size={20} strokeWidth={2} />
            {isEditing ? "Edit Customer" : "Add New Customer"}
          </h2>
          {isGenerating && (
            <span className="form-header-hint">Generating code...</span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="customer-form">
          {/* Row 1: Code, Name */}
          <div className="form-row">
            <CodeInput
              label="Code"
              name="code"
              value={formData.code}
              onChange={handleChange}
              onGenerate={generateCustomerCode}
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
              placeholder="Enter customer name"
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
              placeholder="customer@example.com"
            />
          </div>

          {/* Row 3: City, Tax Number */}
          <div className="form-row">
            <FormInput
              label="City"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="Enter city"
            />

            <FormInput
              label="Tax Number"
              name="taxNumber"
              value={formData.taxNumber}
              onChange={handleChange}
              placeholder="Enter tax number"
              helper="Optional NTN / STRN"
            />
          </div>

          {/* Row 4: Opening Balance, Active (edit mode) */}
          <div className="form-row">
            <FormInput
              label="Opening Balance"
              name="openingBalance"
              type="number"
              step="0.01"
              value={formData.openingBalance}
              onChange={handleChange}
              placeholder="0.00"
              helper="Balance at time of addition"
            />

            {isEditing && (
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
                  Inactive customers are hidden from sale screens
                </span>
              </div>
            )}
          </div>

          {/* Row 5: Address (full width) */}
          <div className="form-row form-row-single">
            <FormTextarea
              label="Address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Enter full address"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              <X size={16} strokeWidth={2} />
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Save size={16} strokeWidth={2} />
              {isEditing ? "Update Customer" : "Save Customer"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  export default CustomerForm;