// components/products/ProductForm.jsx
import { useState, useEffect } from "react";
import { Save, X, Hash, Barcode as BarcodeIcon } from "lucide-react";
import { getNextProductCode, saveProductCode } from "../../services/indexdb/sequenceService";
import { requireCurrentAuthTenantId } from "../../utils/authTenant"; // ✅ Added
import { notify } from "../../utils/notify";
import FormInput from "../common/FormInput";
import FormSelect from "../common/FormSelect";
import FormTextarea from "../common/FormTextarea";
import CodeInput from "../common/CodeInput";
import "../../assets/styles/products/ProductForm.css";

function ProductForm({ product, categories, brands, units, onClose, onSave, onAddCategory, onAddBrand, onAddUnit, masterSelection }) {
  // =========================
  // FORM STATE
  // =========================
  const [formData, setFormData] = useState({
    code: "",
    barcode: "",
    name: "",
    description: "",
    categoryId: "",
    brandId: "",
    unitId: "",
    costPrice: "",
    retailPrice: "",
    taxPercentage: "",
    minimumStock: "",
    openingStock: "",
    imageURL: "",
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [isCodeManuallyEdited, setIsCodeManuallyEdited] = useState(false);
  const [isCodeGenerated, setIsCodeGenerated] = useState(false);
  const [lastGeneratedCode, setLastGeneratedCode] = useState("");

  // =========================
  // LOAD PRODUCT DATA FOR EDIT
  // =========================
  useEffect(() => {
    if (product) {
      setFormData({
        code: product.code || "",
        barcode: product.barcode || "",
        name: product.name || "",
        description: product.description || "",
        categoryId: product.categoryId || "",
        brandId: product.brandId || "",
        unitId: product.unitId || "",
        costPrice: product.costPrice || "",
        retailPrice: product.retailPrice || "",
        taxPercentage: product.taxPercentage || "",
        minimumStock: product.minimumStock || "",
        openingStock: "",
        imageURL: product.imageURL || "",
      });
      setIsCodeGenerated(true);
      setIsCodeManuallyEdited(true);
    } else {
      resetForm();
    }
  }, [product]);

  // =========================
  // SELECT QUICK-ADDED MASTER DATA
  // =========================
  useEffect(() => {
    if (!masterSelection?.id) return;

    if (masterSelection.type === "category") {
      setFormData((prev) => ({ ...prev, categoryId: Number(masterSelection.id) }));
      setIsCodeManuallyEdited(false);
      setIsCodeGenerated(false);
    } else if (masterSelection.type === "brand") {
      setFormData((prev) => ({ ...prev, brandId: Number(masterSelection.id) }));
    } else if (masterSelection.type === "unit") {
      setFormData((prev) => ({ ...prev, unitId: Number(masterSelection.id) }));
    }
  }, [masterSelection]);

  // =========================
  // AUTO-GENERATE ON CATEGORY CHANGE
  // =========================
  useEffect(() => {
    if (product) return;
    if (!formData.categoryId) return;
    if (isCodeManuallyEdited) return;

    const categoryName = getCategoryName(formData.categoryId);
    if (
      !isCodeGenerated ||
      (categoryName &&
        lastGeneratedCode &&
        !lastGeneratedCode.includes(getCategoryPrefix(categoryName)))
    ) {
      generateSequentialCode();
    }
  }, [formData.categoryId, product, isCodeManuallyEdited]);

  // =========================
  // RESET FORM
  // =========================
  function resetForm() {
    setFormData({
      code: "",
      barcode: "",
      name: "",
      description: "",
      categoryId: "",
      brandId: "",
      unitId: "",
      costPrice: "",
      retailPrice: "",
      taxPercentage: "",
      minimumStock: "",
      openingStock: "",
      imageURL: "",
    });
    setIsCodeManuallyEdited(false);
    setIsCodeGenerated(false);
    setLastGeneratedCode("");
    generateBarcode();
  }

  // =========================
  // HELPERS
  // =========================
  function getCategoryPrefix(categoryName) {
    if (!categoryName) return "PRD";
    return categoryName.length >= 3
      ? categoryName.substring(0, 3).toUpperCase()
      : categoryName.toUpperCase();
  }

  function getCategoryName(categoryId) {
    if (!categoryId) return null;
    const category = categories?.find(
      (c) => c.categoryId === Number(categoryId)
    );
    return category ? category.name : null;
  }

  function calculateCheckDigit(barcode12) {
    let sum = 0;
    for (let i = 0; i < barcode12.length; i++) {
      const digit = parseInt(barcode12[i]);
      sum += digit * (i % 2 === 0 ? 3 : 1);
    }
    return (10 - (sum % 10)) % 10;
  }

  // =========================
  // GENERATE SEQUENTIAL CODE
  // =========================
  async function generateSequentialCode() {
    if (isGenerating || product) return;

    const categoryName = getCategoryName(formData.categoryId);
    if (!categoryName) {
      notify.warning("Please select a category first");
      return;
    }

    setIsGenerating(true);
    try {
      const tenantId = requireCurrentAuthTenantId(); // ✅ Get TenantId
      const code = await getNextProductCode(categoryName, tenantId); // ✅ Pass it
      setFormData((prev) => ({ ...prev, code }));
      setLastGeneratedCode(code);
      setIsCodeGenerated(true);
      setIsCodeManuallyEdited(false);
    } catch (error) {
      console.error("Error generating code:", error);
      const prefix = getCategoryPrefix(categoryName);
      const year = new Date().getFullYear().toString().slice(-2);
      const random = Math.floor(1000 + Math.random() * 9000);
      const fallbackCode = `${prefix}-${year}-${random}`;
      setFormData((prev) => ({ ...prev, code: fallbackCode }));
      setLastGeneratedCode(fallbackCode);
      setIsCodeGenerated(true);
      setIsCodeManuallyEdited(false);
    } finally {
      setIsGenerating(false);
    }
  }

  // =========================
  // GENERATE BARCODE
  // =========================
  function generateBarcode() {
    const random12 = Math.floor(100000000000 + Math.random() * 900000000000);
    const barcode12 = random12.toString();
    const checkDigit = calculateCheckDigit(barcode12);
    const barcode = barcode12 + checkDigit;

    setFormData((prev) => ({ ...prev, barcode }));
  }

  // =========================
  // HANDLE CHANGE
  // =========================
  function handleChange(event) {
    const { name, value } = event.target;

    const numericFields = [
      "categoryId",
      "brandId",
      "unitId",
      "costPrice",
      "retailPrice",
      "taxPercentage",
      "minimumStock",
    ];

    if (name === "categoryId") {
      setIsCodeManuallyEdited(false);
      setIsCodeGenerated(false);
      setLastGeneratedCode("");
    }

    if (name === "code") {
      setIsCodeManuallyEdited(true);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: numericFields.includes(name) ? Number(value) || 0 : value,
    }));
  }

  // =========================
  // HANDLE SUBMIT
  // =========================
  async function handleSubmit(event) {
    event.preventDefault();

    if (!formData.categoryId || formData.categoryId === "0") {
      notify.warning("Please select a Category");
      return;
    }
    if (!formData.code) {
      notify.warning("Product Code is required");
      return;
    }
    if (!formData.name) {
      notify.warning("Product Name is required");
      return;
    }
    if (!formData.retailPrice || formData.retailPrice === "0") {
      notify.warning("Retail Price is required");
      return;
    }

    let finalCode = formData.code;

    if (!product) {
      try {
        const tenantId = requireCurrentAuthTenantId(); // ✅ Get TenantId
        const categoryName = getCategoryName(formData.categoryId);
        const savedCode = await saveProductCode(categoryName, tenantId); // ✅ Pass it
        finalCode = savedCode;
        setFormData((prev) => ({ ...prev, code: savedCode }));
      } catch (error) {
        console.error("Error incrementing sequence:", error);
      }
    }
const openingStock = Number(formData.openingStock) || 0;
if (openingStock < 0) {
  notify.warning("Opening stock cannot be negative");
  return;
}
if (openingStock > 0 && !formData.costPrice) {
  notify.warning("Cost Price is required when adding opening stock");
  return;
}

    const cleanedData = {
      code: finalCode,
      barcode: formData.barcode ? formData.barcode.trim() : null,
      name: formData.name.trim(),
      description: formData.description ? formData.description.trim() : null,
      categoryId: formData.categoryId ? Number(formData.categoryId) : 0,
      brandId: formData.brandId ? Number(formData.brandId) : null,
      unitId: formData.unitId ? Number(formData.unitId) : null,
      costPrice: formData.costPrice ? Number(formData.costPrice) : 0,
      retailPrice: Number(formData.retailPrice),
      taxPercentage: formData.taxPercentage
        ? Number(formData.taxPercentage)
        : 0,
      minimumStock: formData.minimumStock
        ? Number(formData.minimumStock)
        : 0,
      currentStock: 0,
      openingStock: isEditing ? 0 : openingStock,
      imageURL: formData.imageURL ? formData.imageURL.trim() : null,
      isActive: true,
    };

    onSave(cleanedData);
  }

  // =========================
  // COMPUTED
  // =========================
  const isEditing = !!product;
  const currentCategoryName = getCategoryName(formData.categoryId);
  const categoryPrefix = currentCategoryName
    ? getCategoryPrefix(currentCategoryName)
    : "PRD";
  const canGenerateCode =
    !isEditing && !isGenerating && !isCodeManuallyEdited && formData.categoryId;

  // =========================
  // BUILD SELECT OPTIONS
  // =========================
  const categoryOptions = (categories || []).map((c) => ({
    value: c.categoryId,
    label: c.name,
  }));

  const brandOptions = (brands || []).map((b) => ({
    value: b.brandId,
    label: b.name,
  }));

  const unitOptions = (units || []).map((u) => ({
    value: u.unitId,
    label: u.shortName ? `${u.name} (${u.shortName})` : u.name,
  }));

  // =========================
  // RENDER
  // =========================
  return (
    <div className="product-form-container form-page">
      <div className="form-header">
        <h2>
          <Hash size={20} strokeWidth={2} />
          {isEditing ? "Edit Product" : "Add New Product"}
        </h2>
        {isGenerating && (
          <span className="form-header-hint">Generating code...</span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="product-form">
        {/* ===== Row 1: Category, Brand, Unit ===== */}
        <div className="form-row">
          <FormSelect
            label="Category"
            name="categoryId"
            value={formData.categoryId}
            onChange={handleChange}
            options={categoryOptions}
            placeholder="Select category"
            searchPlaceholder="Search categories..."
            required={!isEditing}
            disabled={isEditing}
            onAdd={!isEditing ? onAddCategory : null}
            addLabel="Add new category"
            helper={
              isEditing
                ? "Category locked in edit mode"
                : formData.categoryId
                ? `Prefix: ${categoryPrefix} | ${currentCategoryName}`
                : "Select a category to auto-generate code"
            }
          />

          <FormSelect
            label="Brand"
            name="brandId"
            value={formData.brandId}
            onChange={handleChange}
            options={brandOptions}
            placeholder="Select brand"
            searchPlaceholder="Search brands..."
            onAdd={onAddBrand}
            addLabel="Add new brand"
          />

          <FormSelect
            label="Unit"
            name="unitId"
            value={formData.unitId}
            onChange={handleChange}
            options={unitOptions}
            placeholder="Select unit"
            searchPlaceholder="Search units..."
            onAdd={onAddUnit}
            addLabel="Add new unit"
          />
        </div>

        {/* ===== Row 2: Code, Barcode, Name ===== */}
        <div className="form-row">
          <CodeInput
            label="Code"
            name="code"
            value={formData.code}
            onChange={handleChange}
            onGenerate={generateSequentialCode}
            canGenerate={canGenerateCode}
            isGenerating={isGenerating}
            disabled={isEditing}
            required
            placeholder={
              isCodeManuallyEdited ? "Manual entry" : "Auto-generated"
            }
            helper={
              isEditing
                ? "Code locked in edit mode"
                : isCodeManuallyEdited
                ? "Manual entry mode — click the icon to auto-generate"
                : formData.code
                ? `Generated: ${formData.code}`
                : "Auto-generates when category is selected"
            }
          />

          <CodeInput
            label="Barcode"
            name="barcode"
            value={formData.barcode}
            onChange={handleChange}
            onGenerate={generateBarcode}
            canGenerate={true}
            placeholder="Scan or auto-generate"
            helper={
              formData.barcode
                ? `EAN-13: ${formData.barcode}`
                : "Click the icon to generate or scan with a scanner"
            }
          />

          <FormInput
            label="Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter product name"
            required
          />
        </div>

        {/* ===== Row 3: Cost Price, Retail Price, Tax ===== */}
        <div className="form-row">
          <FormInput
            label="Cost Price"
            name="costPrice"
            type="number"
            value={formData.costPrice}
            onChange={handleChange}
            placeholder="0.00"
            step="0.01"
            helper="Purchase price from supplier"
          />

          <FormInput
            label="Retail Price"
            name="retailPrice"
            type="number"
            value={formData.retailPrice}
            onChange={handleChange}
            placeholder="0.00"
            required
            step="0.01"
            helper="Selling price to customers"
          />

          <FormInput
            label="Tax %"
            name="taxPercentage"
            type="number"
            value={formData.taxPercentage}
            onChange={handleChange}
            placeholder="0"
            step="0.01"
            helper="Optional tax percentage"
            info="This percentage is applied to the product price when calculating sale totals."
          />
        </div>

        {/* ===== Row 4: Minimum Stock, Image URL, Description ===== */}
        <div className="form-row">
          <FormInput
            label="Minimum Stock"
            name="minimumStock"
            type="number"
            value={formData.minimumStock}
            onChange={handleChange}
            placeholder="0"
            step="1"
            helper="Low stock alert threshold"
            info="The product is flagged as low stock when its available quantity reaches this level."
          />
{!isEditing && (
  <FormInput
    label="Opening Stock"
    name="openingStock"
    type="number"
    value={formData.openingStock}
    onChange={handleChange}
    placeholder="0"
    step="any"
    helper="Quantity currently on your shelf"
  />
)}
          <FormInput
            label="Image URL"
            name="imageURL"
            value={formData.imageURL}
            onChange={handleChange}
            placeholder="https://example.com/image.jpg"
            helper="Optional product image link"
          />

          <FormTextarea
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Enter product description"
            rows={3}
          />
        </div>

        {/* ===== Actions ===== */}
        <div className="form-actions">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            <X size={16} strokeWidth={2} />
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            <Save size={16} strokeWidth={2} />
            {isEditing ? "Update Product" : "Save Product"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ProductForm;