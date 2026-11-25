// components/suppliers/SupplierForm.jsx
import { useState, useEffect } from "react";
import { Save, X, Building2 } from "lucide-react";
import { getNextSupplierCode, saveSupplierCode } from "../../services/indexdb/sequenceService";
import { requireCurrentAuthTenantId } from "../../utils/authTenant";
import { notify } from "../../utils/notify";
import FormInput from "../common/FormInput";
import FormTextarea from "../common/FormTextarea";
import CodeInput from "../common/CodeInput";
import "../../assets/styles/suppliers/SupplierForm.css";

function SupplierForm({ supplier, onClose, onSave }) {
  // =========================
  // STATE
  // =========================
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    taxNumber: "",
    openingBalance: "",
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

 // =========================
  // GENERATE SUPPLIER CODE
  // =========================
  const generateSupplierCode = async () => {
    setIsGenerating(true);
    try {
      const tenantId = requireCurrentAuthTenantId(); // ✅ Get tenantId
      const code = await getNextSupplierCode(tenantId); // ✅ Pass it
      setFormData((prev) => ({ ...prev, code }));
    } catch (error) {
      console.error("Error generating supplier code:", error);
      const year = new Date().getFullYear().toString().slice(-2);
      const random = Math.floor(1000 + Math.random() * 9000);
      const fallbackCode = `SUP-${year}-${random}`;
      setFormData((prev) => ({ ...prev, code: fallbackCode }));
    } finally {
      setIsGenerating(false);
    }
  };

  // =========================
  // LOAD SUPPLIER DATA OR GENERATE CODE
  // =========================
  useEffect(() => {
    if (supplier) {
      setFormData({
        code: supplier.code || "",
        name: supplier.name || "",
        contactPerson: supplier.contactPerson || "",
        phone: supplier.phone || "",
        email: supplier.email || "",
        address: supplier.address || "",
        city: supplier.city || "",
        taxNumber: supplier.taxNumber || "",
        openingBalance: supplier.openingBalance ?? "",
      });
      setIsLoading(false);
    } else {
      generateSupplierCode();
      setFormData({
        code: "",
        name: "",
        contactPerson: "",
        phone: "",
        email: "",
        address: "",
        city: "",
        taxNumber: "",
        openingBalance: "",
      });
      setIsLoading(false);
    }
  }, [supplier]);

  // =========================
  // HANDLE CHANGE
  // =========================
  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  // =========================
  // HANDLE SUBMIT
  // =========================
  async function handleSubmit(event) {
    event.preventDefault();

    if (!formData.code) {
      notify.warning("Supplier Code is required");
      return;
    }
    if (!formData.name) {
      notify.warning("Supplier Name is required");
      return;
    }

   if (!supplier) {
      try {
        const tenantId = requireCurrentAuthTenantId(); // ✅ Get tenantId
        await saveSupplierCode(tenantId); // ✅ Pass it
      } catch (error) {
        console.error("Error saving supplier code sequence:", error);
      }
    }

    const cleanedData = {
      code: formData.code.trim(),
      name: formData.name.trim(),
      contactPerson: formData.contactPerson?.trim() || null,
      phone: formData.phone?.trim() || null,
      email: formData.email?.trim() || null,
      address: formData.address?.trim() || null,
      city: formData.city?.trim() || null,
      taxNumber: formData.taxNumber?.trim() || null,
      openingBalance: Number(formData.openingBalance) || 0,
    };

    onSave(cleanedData);
  }

  const isEditing = !!supplier;

  // =========================
  // LOADING STATE
  // =========================
  if (isLoading) {
    return (
      <div className="supplier-form-container form-page">
        <div className="form-loading">Loading supplier...</div>
      </div>
    );
  }

  // =========================
  // RENDER
  // =========================
  return (
    <div className="supplier-form-container form-page">
      {/* Header */}
      <div className="form-header">
        <h2>
          <Building2 size={20} strokeWidth={2} />
          {isEditing ? "Edit Supplier" : "Add New Supplier"}
        </h2>
        {isGenerating && (
          <span className="form-header-hint">Generating code...</span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="supplier-form">
        {/* Row 1: Code, Name */}
        <div className="form-row">
          <CodeInput
            label="Code"
            name="code"
            value={formData.code}
            onChange={handleChange}
            onGenerate={generateSupplierCode}
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
            placeholder="Enter supplier name"
            required
          />
        </div>

        {/* Row 2: Contact Person, Phone */}
        <div className="form-row">
          <FormInput
            label="Contact Person"
            name="contactPerson"
            value={formData.contactPerson}
            onChange={handleChange}
            placeholder="Enter contact person"
            helper="Primary point of contact"
          />

          <FormInput
            label="Phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Enter phone number"
          />
        </div>

        {/* Row 3: Email, City */}
        <div className="form-row">
          <FormInput
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="supplier@example.com"
          />

          <FormInput
            label="City"
            name="city"
            value={formData.city}
            onChange={handleChange}
            placeholder="Enter city"
          />
        </div>

        {/* Row 4: Tax Number, Opening Balance */}
        <div className="form-row">
          <FormInput
            label="Tax Number"
            name="taxNumber"
            value={formData.taxNumber}
            onChange={handleChange}
            placeholder="Enter tax number"
            helper="Optional NTN / STRN"
          />
  <FormInput
    label="Opening Balance (Payable)"
    name="openingBalance"
    type="number"
    step="0.01"
    value={formData.openingBalance}
    onChange={handleChange}
    placeholder="0.00"
    helper="Amount you already owe this supplier"
  />
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
            {isEditing ? "Update Supplier" : "Save Supplier"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default SupplierForm;