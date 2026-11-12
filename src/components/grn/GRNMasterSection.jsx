// components/grn/GRNMasterSection.jsx
import { ClipboardList } from "lucide-react";
import CodeInput from "../common/CodeInput";
import FormSelect from "../common/FormSelect";
import FormDatePicker from "../common/FormDatePicker";
import FormInput from "../common/FormInput";

function GRNMasterSection({
  formData,
  isEditing,
  isGenerating,
  onGenerateCode,
  onChange,
  onSupplierChange,
  suppliers,
  selectedSupplier,
}) {
  const supplierOptions = (suppliers || []).map((s) => ({
    value: s.supplierId,
    label: s.name,
  }));

  return (
    <div className="grn-master-section">
      <h3>
        <ClipboardList size={16} strokeWidth={2} />
        GRN Information
      </h3>

      <div className="form-row">
        <CodeInput
          label="GRN Number"
          name="grnNumber"
          value={formData.grnNumber}
          onChange={onChange}
          onGenerate={onGenerateCode}
          canGenerate={!isEditing}
          isGenerating={isGenerating}
          disabled={isEditing}
          required
          placeholder="Auto-generated"
          helper={isEditing ? "Code locked in edit mode" : "Auto-generated"}
        />

        <FormSelect
          label="Supplier"
          name="supplierId"
          value={formData.supplierId}
          onChange={onSupplierChange}
          options={supplierOptions}
          placeholder="Select supplier"
          searchPlaceholder="Search suppliers..."
          required
          helper={selectedSupplier ? `Selected: ${selectedSupplier.name}` : null}
        />

        <FormDatePicker
          label="GRN Date"
          name="grnDate"
          value={formData.grnDate}
          onChange={onChange}
          required
          placeholder="Select GRN date"
        />
      </div>

      <div className="form-row two-col">
        <FormInput
          label="Received By"
          name="receivedBy"
          value={formData.receivedBy}
          onChange={onChange}
          placeholder="Enter receiver name"
          helper="Name of the person who received the goods"
        />
      </div>
    </div>
  );
}

export default GRNMasterSection;