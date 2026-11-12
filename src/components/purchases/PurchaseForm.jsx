// components/purchases/PurchaseForm.jsx
import { useEffect, useState } from "react";
import {
  Save,
  X,
  Package,
  ShoppingCart,
  Calculator,
  MessageSquare,
  Search,
  FileText,
} from "lucide-react";
import { getNextPurchaseCode, savePurchaseCode } from "../../services/indexdb/sequenceService";
import { getProductsFromIndexedDB } from "../../services/indexdb/productService";
import { getProducts, refreshProductCache } from "../../services/ProductDefinition/productService";
import ItemLookupModal from "../common/ItemLookupModal";
import FormInput from "../common/FormInput";
import FormSelect from "../common/FormSelect";
import FormDatePicker from "../common/FormDatePicker";
import FormTextarea from "../common/FormTextarea";
import CodeInput from "../common/CodeInput";
import PurchaseDetailRow from "./PurchaseDetailRow";
import { purchaseLookupColumns } from "../../models/productLookupColumns.jsx";
import { notify } from "../../utils/notify";
import "../../assets/styles/purchases/PurchaseForm.css";

function PurchaseForm({ purchase, onClose, onSave, suppliers = [] }) {
  // =========================
  // STATE
  // =========================
  const [formData, setFormData] = useState({
    purchaseNumber: "",
    supplierId: "",
    purchaseDate: "",
    expectedDeliveryDate: "",
    status: "Pending",
    subTotal: 0,
    discount: 0,
    tax: 0,
    total: 0,
    comments: "",
    createdBy: null,
    details: [],
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [localProducts, setLocalProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // =========================
  // LOAD PRODUCTS
  // =========================
  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setLoadingProducts(true);
    try {
      let productData = await getProductsFromIndexedDB();
      if (!productData || productData.length === 0) {
        const apiProducts = await getProducts();
        productData = apiProducts;
      }
      setLocalProducts(productData);
    } catch (error) {
      console.error("Error loading products:", error);
      try {
        const apiProducts = await getProducts();
        setLocalProducts(apiProducts);
      } catch (apiError) {
        setLocalProducts([]);
      }
    } finally {
      setLoadingProducts(false);
    }
  }

  const handleRefreshProducts = async () => {
    try {
      const freshProducts = await refreshProductCache();
      setLocalProducts(freshProducts);
      return freshProducts;
    } catch (error) {
      console.error("Failed to refresh products:", error);
      notify.error("Failed to refresh product list");
      throw error;
    }
  };

  // =========================
  // GENERATE CODE
  // =========================
  const generatePurchaseCode = async () => {
    setIsGenerating(true);
    try {
      const code = await getNextPurchaseCode();
      setFormData((prev) => ({ ...prev, purchaseNumber: code }));
    } catch (error) {
      console.error("Error generating purchase code:", error);
      const year = new Date().getFullYear().toString().slice(-2);
      const random = Math.floor(1000 + Math.random() * 9000);
      const fallback = `PO-${year}-${random}`;
      setFormData((prev) => ({ ...prev, purchaseNumber: fallback }));
    } finally {
      setIsGenerating(false);
    }
  };

  // =========================
  // LOAD PURCHASE FOR EDIT
  // =========================
  useEffect(() => {
    if (purchase) {
      setFormData({
        purchaseNumber: purchase.purchaseNumber || "",
        supplierId: purchase.supplierId || "",
        purchaseDate: purchase.purchaseDate
          ? purchase.purchaseDate.substring(0, 10)
          : "",
        expectedDeliveryDate: purchase.expectedDeliveryDate
          ? purchase.expectedDeliveryDate.substring(0, 10)
          : "",
        status: purchase.status || "Pending",
        subTotal: purchase.subTotal || 0,
        discount: purchase.discount || 0,
        tax: purchase.tax || 0,
        total: purchase.total || 0,
        comments: purchase.comments || "",
        createdBy: purchase.createdBy || null,
        details: (purchase.details || []).map((detail) => ({
          ...detail,
          rowState: "Original",
        })),
      });
      setSelectedProductIds((purchase.details || []).map((d) => d.productId));
      setIsLoading(false);
    } else {
      generatePurchaseCode();
      setFormData({
        purchaseNumber: "",
        supplierId: "",
        purchaseDate: new Date().toISOString().split("T")[0],
        expectedDeliveryDate: "",
        status: "Pending",
        subTotal: 0,
        discount: 0,
        tax: 0,
        total: 0,
        comments: "",
        createdBy: null,
        details: [],
      });
      setSelectedProductIds([]);
      setIsLoading(false);
    }
  }, [purchase]);

  // =========================
  // MASTER CHANGE
  // =========================
  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  // =========================
  // ADD / REMOVE PRODUCT FROM MODAL
  // =========================
  const handleProductSelectFromModal = (product, selected) => {
    if (selected) {
      const existing = formData.details.find(
        (d) => d.productId === product.productId
      );
      if (existing) {
        notify.warning(`${product.name} is already added`);
        return;
      }
  
      const productTax = product.taxPercentage || product.tax || 0;
  
      const newDetail = {
        purchaseDetailId: 0,
        productId: product.productId,
        productName: product.name,
        quantity: 1,
        costPrice: product.costPrice || 0,
        discount: 0,
        tax: productTax,
        total: product.costPrice || 0,
        rowState: "Added",
      };
  
      setFormData((prev) => ({
        ...prev,
        details: [...prev.details, newDetail],
      }));
      setSelectedProductIds((prev) => [...prev, product.productId]);
    } else {
      // ✅ FIX: actually remove the detail when deselected
      removeProductFromDetails(product.productId);
    }
  };
  // =========================
  // REMOVE PRODUCT FROM DETAILS (used by ItemLookupModal deselect)
  // =========================
  function removeProductFromDetails(productId) {
    setFormData((prev) => ({
      ...prev,
      details: prev.details.filter((d) => d.productId !== productId),
    }));
  }
  // =========================
  // DETAIL CHANGE
  // =========================
  function handleDetailChange(index, field, value) {
    setFormData((current) => {
      const updatedDetails = [...current.details];
      const detail = updatedDetails[index];
      updatedDetails[index] = {
        ...detail,
        [field]: value,
        rowState: detail.rowState === "Original" ? "Modified" : detail.rowState,
      };
      return { ...current, details: updatedDetails };
    });
  }

  // =========================
  // REMOVE DETAIL
  // =========================
  function removeDetail(index) {
    setFormData((current) => {
      const updatedDetails = [...current.details];
      const detail = updatedDetails[index];
      setSelectedProductIds((prev) =>
        prev.filter((id) => id !== detail.productId)
      );
      if (detail.rowState === "Added") {
        updatedDetails.splice(index, 1);
      } else {
        updatedDetails[index] = { ...detail, rowState: "Deleted" };
      }
      return { ...current, details: updatedDetails };
    });
  }

  // =========================
  // AUTO-CALCULATE TOTALS
  // =========================
  useEffect(() => {
    let subTotal = 0;
    let discount = 0;
    let tax = 0;

    formData.details.forEach((detail) => {
      if (detail.rowState === "Deleted") return;

      const quantity = Number(detail.quantity) || 0;
      const costPrice = Number(detail.costPrice) || 0;
      const detailDiscount = Number(detail.discount) || 0;
      const detailTax = Number(detail.tax) || 0;

      const detailTotal = quantity * costPrice - detailDiscount + detailTax;

      subTotal += quantity * costPrice;
      discount += detailDiscount;
      tax += detailTax;

      detail.total = detailTotal;
    });

    const total = subTotal - discount + tax;

    setFormData((current) => ({
      ...current,
      subTotal,
      discount,
      tax,
      total,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.details]);

  // =========================
  // SUBMIT
  // =========================
  async function handleSubmit(event) {
    event.preventDefault();
  
    // ── Required field checks ──
    if (!formData.purchaseNumber) {
      notify.warning("Purchase Number is required");
      return;
    }
    if (!formData.supplierId) {
      notify.warning("Please select a supplier");
      return;
    }
    if (!formData.purchaseDate) {
      notify.warning("Purchase Date is required");
      return;
    }
  
    const activeDetails = formData.details.filter(
      (d) => d.rowState !== "Deleted"
    );
    if (activeDetails.length === 0) {
      notify.warning("Please add at least one product");
      return;
    }
  
    if (!purchase) {
      try {
        await savePurchaseCode();
      } catch (error) {
        console.error("Error saving purchase code sequence:", error);
      }
    }
  
    // ✅ Normalize: empty string → null
    const expectedDeliveryDate =
      formData.expectedDeliveryDate?.trim() ? formData.expectedDeliveryDate : null;
  
    const cleanedData = {
      ...formData,
      purchaseDate: formData.purchaseDate || null,
      expectedDeliveryDate,               // null if empty
      supplierId: Number(formData.supplierId),
      subTotal: Number(formData.subTotal),
      discount: Number(formData.discount),
      tax: Number(formData.tax),
      total: Number(formData.total),
      details: activeDetails.map((detail) => ({
        ...detail,
        productId: Number(detail.productId),
        quantity: Number(detail.quantity),
        costPrice: Number(detail.costPrice),
        discount: Number(detail.discount),
        tax: Number(detail.tax),
        total: Number(detail.total),
      })),
    };
  
    onSave(cleanedData);
  }
  // =========================
  // SELECT OPTIONS
  // =========================
  const supplierOptions = (suppliers || []).map((s) => ({
    value: s.supplierId,
    label: s.name || s.code || `Supplier ${s.supplierId}`,
  }));

  const statusOptions = [
    { value: "Pending", label: "Pending" },
    { value: "Approved", label: "Approved" },
    { value: "Received", label: "Received" },
    { value: "Cancelled", label: "Cancelled" },
  ];

  const isEditing = !!purchase;

  // =========================
  // LOADING
  // =========================
  if (isLoading || loadingProducts) {
    return (
      <div className="purchase-form-container">
        <div className="form-loading">Loading purchase...</div>
      </div>
    );
  }

  // =========================
  // RENDER
  // =========================
  const activeDetails = formData.details.filter(
    (d) => d.rowState !== "Deleted"
  );

  return (
    <div className="purchase-form-container">
      {/* Header */}
  <div className="form-header">
  <h2>
    <Package size={20} strokeWidth={2} />
    {isEditing ? "Edit Purchase Order" : "New Purchase Order"}
  </h2>
  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
    {isEditing && (
      <span className={`status-badge status-${formData.status?.toLowerCase()}`}
        style={{
          padding: "4px 12px",
          borderRadius: "12px",
          fontSize: "12px",
          fontWeight: "600",
          background: formData.status === "Received" ? "#DCFCE7" :
                     formData.status === "Cancelled" ? "#FEE2E2" :
                     formData.status === "Approved" ? "#DBEAFE" : "#FEF3C7",
          color: formData.status === "Received" ? "#166534" :
                 formData.status === "Cancelled" ? "#991B1B" :
                 formData.status === "Approved" ? "#1E40AF" : "#92400E",
        }}>
        {formData.status || "Pending"}
      </span>
    )}
    {isGenerating && (
      <span className="form-header-hint">Generating code...</span>
    )}
  </div>
</div>

      <form onSubmit={handleSubmit} className="purchase-form">
        {/* =====================
            MASTER SECTION
        ====================== */}
        <div className="purchase-section">
          <h3>
            <FileText size={16} strokeWidth={2} />
            Purchase Information
          </h3>

                  <div className="form-row">
            <CodeInput
              label="Purchase Number"
              name="purchaseNumber"
              value={formData.purchaseNumber}
              onChange={handleChange}
              onGenerate={generatePurchaseCode}
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
              onChange={handleChange}
              options={supplierOptions}
              placeholder="Select supplier"
              searchPlaceholder="Search suppliers..."
              required
            />
          </div>  {/* ✅ ADD THIS — closes the first row */}

          <div className="form-row two-col">
            <FormDatePicker
              label="Purchase Date"
              name="purchaseDate"
              value={formData.purchaseDate}
              onChange={handleChange}
              required
            />

            <FormDatePicker
              label="Expected Delivery"
              name="expectedDeliveryDate"
              value={formData.expectedDeliveryDate}
              onChange={handleChange}
              minDate={formData.purchaseDate}
              helper="Optional — planned arrival date"
            />
          </div>
        </div>  {/* ✅ Closes purchase-section */}

        {/* =====================
            DETAILS SECTION
        ====================== */}
        <div className="purchase-section">
          <div className="purchase-section-header">
            <h3>
              <ShoppingCart size={16} strokeWidth={2} />
              Purchase Items ({activeDetails.length})
            </h3>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setShowProductModal(true)}
            >
              <Search size={14} strokeWidth={2} />
              Browse Products
            </button>
          </div>

          {activeDetails.length === 0 ? (
            <div className="purchase-empty">
              <ShoppingCart size={32} strokeWidth={1.25} />
              <p>No products added yet</p>
              <span>Click "Browse Products" to add items to this order.</span>
            </div>
          ) : (
            <div className="purchase-detail-list">
              {formData.details.map((detail, index) => {
                if (detail.rowState === "Deleted") return null;
                return (
                  <PurchaseDetailRow
                    key={`${detail.productId}-${index}`}
                    detail={detail}
                    index={index}
                    onChange={handleDetailChange}
                    onRemove={removeDetail}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* =====================
            TOTALS SECTION
        ====================== */}
        <div className="purchase-section">
          <h3>
            <Calculator size={16} strokeWidth={2} />
            Order Summary
          </h3>

          <div className="purchase-totals">
            <div className="purchase-total-item">
              <span className="purchase-total-label">Sub Total</span>
              <span className="purchase-total-value">
                PKR {formData.subTotal.toFixed(2)}
              </span>
            </div>

            <div className="purchase-total-item">
              <span className="purchase-total-label">Discount</span>
              <span className="purchase-total-value discount">
                - PKR {formData.discount.toFixed(2)}
              </span>
            </div>

            <div className="purchase-total-item">
              <span className="purchase-total-label">Tax</span>
              <span className="purchase-total-value tax">
                + PKR {formData.tax.toFixed(2)}
              </span>
            </div>

            <div className="purchase-total-item grand">
              <span className="purchase-total-label">Grand Total</span>
              <span className="purchase-total-value">
                PKR {formData.total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* =====================
            COMMENTS SECTION
        ====================== */}
        <div className="purchase-section">
          <h3>
            <MessageSquare size={16} strokeWidth={2} />
            Comments
          </h3>

          <FormTextarea
            label=""
            name="comments"
            value={formData.comments}
            onChange={handleChange}
            placeholder="Enter any additional notes for this purchase order..."
            rows={3}
          />
        </div>

        {/* =====================
            ACTIONS
        ====================== */}
        <div className="form-actions">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            <X size={16} strokeWidth={2} />
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            <Save size={16} strokeWidth={2} />
            {isEditing ? "Update Purchase" : "Save Purchase"}
          </button>
        </div>
      </form>

      {/* Item lookup modal */}
      <ItemLookupModal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        onSelectItem={handleProductSelectFromModal}
        items={localProducts}
        selectedItems={activeDetails.map((d) => ({ productId: d.productId }))}
        title="Select Products for Purchase"
        searchPlaceholder="Search by code, name, or barcode..."
        loading={loadingProducts}
        emptyMessage="No products found"
        multiSelect={true}
        columns={purchaseLookupColumns}
        onRefresh={handleRefreshProducts}
      />
    </div>
  );
}

export default PurchaseForm;