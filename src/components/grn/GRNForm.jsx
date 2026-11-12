// components/grn/GRNForm.jsx
import { useEffect, useState, useRef, useMemo } from "react";
import { Save, X, ClipboardList } from "lucide-react";
import { getNextGRNCode, saveGRNCode } from "../../services/indexdb/sequenceService";
import { getPurchaseById } from "../../services/PurchaseDefinition/purchaseService";
import ItemLookupModal from "../common/ItemLookupModal";
import ConfirmDialog from "../common/ConfirmDialog";
import { notify } from "../../utils/notify";
import GRNMasterSection from "./GRNMasterSection";
import GRNEntryModeTabs from "./GRNEntryModeTabs";
import GRNProductPicker from "./GRNProductPicker";
import GRNPurchasePicker from "./GRNPurchasePicker";
import GRNDetailsTable from "./GRNDetailsTable";
import GRNComments from "./GRNComments";
import "../../assets/styles/grn/GRNForm.css";

function GRNForm({ grn, onClose, onSave, suppliers = [], purchases = [], products = [] }) {
  // =========================
  // STATE
  // =========================
  const [formData, setFormData] = useState({
    grnNumber: "",
    supplierId: "",
    purchaseId: null,
    grnDate: "",
    receivedBy: "",
    comments: "",
    details: [],
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [entryMode, setEntryMode] = useState("product");
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [loadingPurchase, setLoadingPurchase] = useState(false);
  const [localProducts, setLocalProducts] = useState(products);
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    purchase: null,
    itemCount: 0,
  });

  const initialLoadDone = useRef(false);
  const detailsModified = useRef(false);

  useEffect(() => {
    setLocalProducts(products);
  }, [products]);

  // =========================
  // GENERATE GRN CODE
  // =========================
  const generateGRNCode = async () => {
    setIsGenerating(true);
    try {
      const code = await getNextGRNCode();
      setFormData((prev) => ({ ...prev, grnNumber: code }));
    } catch (error) {
      console.error("Error generating GRN code:", error);
      const year = new Date().getFullYear().toString().slice(-2);
      const random = Math.floor(1000 + Math.random() * 9000);
      const fallbackCode = `GRN-${year}-${random}`;
      setFormData((prev) => ({ ...prev, grnNumber: fallbackCode }));
    } finally {
      setIsGenerating(false);
    }
  };

  // =========================
  // LOAD GRN FOR EDIT
  // =========================
  useEffect(() => {
    if (initialLoadDone.current) return;

    if (grn) {
      if (!detailsModified.current) {
        const loadedDetails = (grn.details || [])
          .filter((d) => d.rowState !== "Deleted")
          .map((d) => ({ ...d, rowState: "Original", isVoid: false }));

        setFormData({
          grnNumber: grn.grnNumber || "",
          supplierId: grn.supplierId || "",
          purchaseId: grn.purchaseId || null,
          grnDate: grn.grnDate ? grn.grnDate.substring(0, 10) : "",
          receivedBy: grn.receivedBy || "",
          comments: grn.comments || "",
          details: loadedDetails,
        });
      }

      const supplier = suppliers.find((s) => s.supplierId === grn.supplierId);
      if (supplier) setSelectedSupplier(supplier);

      if (grn.purchaseId) fetchPurchaseDetails(grn.purchaseId);

      setIsLoading(false);
      initialLoadDone.current = true;
    } else {
      generateGRNCode();
      setFormData({
        grnNumber: "",
        supplierId: "",
        purchaseId: null,
        grnDate: new Date().toISOString().split("T")[0],
        receivedBy: "",
        comments: "",
        details: [],
      });
      setSelectedSupplier(null);
      setSelectedPurchase(null);
      setEntryMode("product");
      setIsLoading(false);
      initialLoadDone.current = true;
    }
  }, [grn]);

  // =========================
  // FETCH PURCHASE DETAILS
  // =========================
  const fetchPurchaseDetails = async (purchaseId) => {
    setLoadingPurchase(true);
    try {
      const purchaseData = await getPurchaseById(purchaseId);
      if (purchaseData) {
        setSelectedPurchase(purchaseData);
        if (purchaseData.details && purchaseData.details.length > 0) {
          detailsModified.current = false;
          loadPurchaseDetails(purchaseData);
        } else {
          notify.warning("This purchase has no items");
        }
      }
    } catch (error) {
      console.error("Error fetching purchase details:", error);
      notify.error("Failed to load purchase details. Please try again");
    } finally {
      setLoadingPurchase(false);
    }
  };

  // =========================
  // LOAD PURCHASE DETAILS (with confirm for many items)
  // =========================
  function loadPurchaseDetails(purchase) {
    if (!purchase || !purchase.details || purchase.details.length === 0) {
      notify.warning("This purchase has no items");
      return;
    }

    const itemCount = purchase.details.length;
    if (itemCount > 10) {
      setConfirmState({ isOpen: true, purchase, itemCount });
      return;
    }

    applyPurchaseDetails(purchase);
  }

  function applyPurchaseDetails(purchase) {
    const newDetails = purchase.details.map((detail) => {
      const qty = Number(detail.quantity) || 0;
      const cost = Number(detail.costPrice) || 0;
      const total = qty * cost;

      const existingIndex = formData.details.findIndex(
        (d) => d.productId === detail.productId && d.rowState !== "Deleted"
      );

      if (existingIndex !== -1) {
        return {
          ...formData.details[existingIndex],
          orderedQuantity: qty,
          receivedQuantity: qty,
          acceptedQuantity: qty,
          costPrice: cost,
          total,
          rowState: "Modified",
        };
      }

      return {
        grnDetailId: 0,
        productId: detail.productId,
        productName: detail.productName || `Product ${detail.productId}`,
        orderedQuantity: qty,
        receivedQuantity: qty,
        damagedQuantity: 0,
        acceptedQuantity: qty,
        costPrice: cost,
        total,
        rowState: "Added",
        isVoid: false,
      };
    });

    setFormData((prev) => ({
      ...prev,
      purchaseId: purchase.purchaseId,
      details: newDetails,
    }));
    detailsModified.current = true;

    if (!formData.supplierId && purchase.supplierId) {
      const supplier = suppliers.find(
        (s) => s.supplierId === purchase.supplierId
      );
      if (supplier) {
        setSelectedSupplier(supplier);
        setFormData((prev) => ({
          ...prev,
          supplierId: supplier.supplierId,
        }));
      }
    }

    setConfirmState({ isOpen: false, purchase: null, itemCount: 0 });
  }

  // =========================
  // REFRESH PRODUCTS
  // =========================
  const handleRefreshProducts = async () => {
    try {
      const { refreshProductCache } = await import(
        "../../services/ProductDefinition/productService"
      );
      const freshProducts = await refreshProductCache();
      setLocalProducts(freshProducts);
      return freshProducts;
    } catch (error) {
      console.error("Failed to refresh products:", error);
      notify.error("Failed to refresh product list. Please try again");
      throw error;
    }
  };

  // =========================
  // CALCULATE TOTALS
  // =========================
  const calculateDetailTotal = (detail) => {
    const received = Number(detail.receivedQuantity) || 0;
    const costPrice = Number(detail.costPrice) || 0;
    return received * costPrice;
  };

  const updateDetailTotal = (detail) => {
    return { ...detail, total: calculateDetailTotal(detail) };
  };

  // =========================
  // SUPPLIER SELECT
  // =========================
  function handleSupplierChange(event) {
    const supplierId = Number(event.target.value);
    const supplier = suppliers.find((s) => s.supplierId === supplierId);
    setSelectedSupplier(supplier || null);
    setFormData((prev) => ({
      ...prev,
      supplierId: supplierId || "",
      purchaseId: null,
      details: [],
    }));
    setSelectedPurchase(null);
    detailsModified.current = false;
  }

  // =========================
  // PURCHASE SELECT
  // =========================
  async function handlePurchaseSelect(event) {
    const purchaseId = Number(event.target.value);
    if (!purchaseId) {
      setSelectedPurchase(null);
      setFormData((prev) => ({
        ...prev,
        purchaseId: null,
        details: [],
      }));
      detailsModified.current = false;
      return;
    }
    await fetchPurchaseDetails(purchaseId);
  }

  // =========================
  // MASTER FIELD CHANGE
  // =========================
  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  // =========================
  // ADD / REMOVE PRODUCT FROM MODAL
  // =========================
  const handleProductSelectFromModal = (product, selected) => {
    if (selected) {
      const existing = formData.details.find(
        (d) => d.productId === product.productId && !d.isVoid
      );
      if (existing) {
        notify.warning(`${product.name} is already added`);
        return;
      }
  
      const newDetail = {
        grnDetailId: 0,
        productId: product.productId,
        productName: product.name,
        orderedQuantity: 0,
        receivedQuantity: 1,
        damagedQuantity: 0,
        acceptedQuantity: 1,
        costPrice: product.costPrice || 0,
        total: product.costPrice || 0,
        rowState: "Added",
        isVoid: false,
      };
  
      setFormData((current) => ({
        ...current,
        details: [...current.details, newDetail],
      }));
      detailsModified.current = true;
      setSelectedProductIds([...selectedProductIds, product.productId]);
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
      details: prev.details.filter(
        (d) => !(d.productId === productId && d.rowState !== "Deleted")
      ),
    }));
    setSelectedProductIds((prev) => prev.filter((id) => id !== productId));
    detailsModified.current = true;
  }
  // =========================
  // VOID / RESTORE
  // =========================
  function toggleVoidDetail(index) {
    setFormData((current) => {
      const updatedDetails = [...current.details];
      const detail = updatedDetails[index];
      const isNowVoid = !detail.isVoid;

      updatedDetails[index] = {
        ...detail,
        isVoid: isNowVoid,
        rowState: isNowVoid
          ? "Deleted"
          : detail.rowState === "Deleted"
          ? "Modified"
          : detail.rowState,
      };

      detailsModified.current = true;
      return { ...current, details: updatedDetails };
    });
  }

  // =========================
  // DETAIL CHANGE
  // =========================
  function handleDetailChange(index, field, value) {
    setFormData((current) => {
      const updatedDetails = [...current.details];
      const detail = updatedDetails[index];

      if (detail.isVoid) {
        notify.warning("Cannot edit a voided item. Restore it first");
        return current;
      }

      let updatedDetail = { ...detail, [field]: value };

      if (field === "receivedQuantity" || field === "costPrice") {
        updatedDetail = updateDetailTotal(updatedDetail);
      }

      if (detail.rowState === "Original") {
        updatedDetail.rowState = "Modified";
      }

      updatedDetails[index] = updatedDetail;
      detailsModified.current = true;
      return { ...current, details: updatedDetails };
    });
  }

  // =========================
  // SEARCH IN PRODUCT LIST
  // =========================
  function handleSearchChange(event) {
    const term = event.target.value;
    setSearchTerm(term);

    if (!term.trim()) {
      setFilteredProducts(products);
      return;
    }

    const filtered = products.filter(
      (p) =>
        p.code?.toLowerCase().includes(term.toLowerCase()) ||
        p.name?.toLowerCase().includes(term.toLowerCase()) ||
        p.barcode?.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredProducts(filtered);
  }

  // =========================
  // SUPPLIER PURCHASES
  // =========================
  const supplierPurchases = useMemo(() => {
    if (!selectedSupplier) return [];
    return purchases.filter(
      (p) =>
        p.supplierId === selectedSupplier.supplierId &&
        p.status?.toLowerCase() === "pending"
    );
  }, [selectedSupplier, purchases]);

  // =========================
  // SUBMIT
  // =========================
  async function handleSubmit(event) {
    event.preventDefault();

    if (!formData.grnNumber) {
      notify.warning("GRN Number is required");
      return;
    }
    if (!formData.supplierId) {
      notify.warning("Please select a supplier");
      return;
    }
    if (!formData.grnDate) {
      notify.warning("GRN Date is required");
      return;
    }

    const activeItems = formData.details.filter(
      (d) => d.rowState !== "Deleted"
    );
    if (activeItems.length === 0) {
      notify.warning("Please add at least one product");
      return;
    }

    if (!grn) {
      try {
        await saveGRNCode();
      } catch (error) {
        console.error("Error saving GRN code sequence:", error);
      }
    }

    const cleanedData = {
      grnNumber: formData.grnNumber,
      supplierId: Number(formData.supplierId),
      purchaseId: formData.purchaseId ? Number(formData.purchaseId) : null,
      grnDate: formData.grnDate,
      receivedBy: formData.receivedBy || null,
      comments: formData.comments || null,
      details: formData.details
        .filter((d) => d.rowState !== "Deleted")
        .map((detail) => ({
          productId: Number(detail.productId),
          orderedQuantity: Number(detail.orderedQuantity),
          receivedQuantity: Number(detail.receivedQuantity),
          damagedQuantity: Number(detail.damagedQuantity),
          acceptedQuantity: Number(detail.acceptedQuantity),
          costPrice: Number(detail.costPrice),
          total: Number(calculateDetailTotal(detail)),
          rowState: detail.rowState,
          RowState: detail.rowState,
        })),
    };

    const deletedItems = formData.details
      .filter((d) => d.rowState === "Deleted")
      .map((detail) => ({
        grnDetailId: detail.grnDetailId || 0,
        productId: Number(detail.productId),
        orderedQuantity: Number(detail.orderedQuantity),
        receivedQuantity: Number(detail.receivedQuantity),
        damagedQuantity: Number(detail.damagedQuantity),
        acceptedQuantity: Number(detail.acceptedQuantity),
        costPrice: Number(detail.costPrice),
        total: Number(calculateDetailTotal(detail)),
        rowState: "Deleted",
        RowState: "Deleted",
      }));

    cleanedData.details = [...cleanedData.details, ...deletedItems];

    try {
      await onSave(cleanedData);

      if (formData.purchaseId) {
        setSelectedPurchase(null);
        setFormData((prev) => ({
          ...prev,
          purchaseId: null,
          details: [],
        }));
        setEntryMode("product");
        detailsModified.current = false;
      }
    } catch (error) {
      console.error("Error saving GRN:", error);
      notify.error("Failed to save GRN. Please try again");
    }
  }

  // =========================
  // MODE CHANGE
  // =========================
  const handleModeChange = (mode) => {
    setEntryMode(mode);
    setSelectedPurchase(null);
    setFormData((prev) => ({
      ...prev,
      purchaseId: null,
      details: [],
    }));
    setSelectedProductIds([]);
    detailsModified.current = false;
  };

  // =========================
  // LOOKUP MODAL COLUMNS
  // =========================
  const lookupColumns = [
    { key: "code", label: "Code" },
    { key: "name", label: "Name" },
    {
      key: "costPrice",
      label: "Cost Price",
      className: "numeric",
      render: (item) => `PKR ${item.costPrice || 0}`,
    },
    {
      key: "currentStock",
      label: "Current Stock",
      className: "numeric",
      render: (item) => item.currentStock || 0,
    },
  ];

  const activeCount = formData.details.filter(
    (d) => d.rowState !== "Deleted"
  ).length;
  const voidedCount = formData.details.filter(
    (d) => d.rowState === "Deleted"
  ).length;

  // =========================
  // LOADING
  // =========================
  if (isLoading) {
    return (
      <div className="grn-form-container">
        <div className="form-loading">Loading GRN...</div>
      </div>
    );
  }

  // =========================
  // RENDER
  // =========================
  return (
    <div className="grn-form-container">
      {/* Header */}
      <div className="form-header">
        <h2>
          <ClipboardList size={20} strokeWidth={2} />
          {grn ? "Edit GRN" : "Add New GRN"}
        </h2>
        {isGenerating && (
          <span className="form-header-hint">Generating code...</span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="grn-form">
        {/* Master section */}
        <GRNMasterSection
          formData={formData}
          isEditing={!!grn}
          isGenerating={isGenerating}
          onGenerateCode={generateGRNCode}
          onChange={handleChange}
          onSupplierChange={handleSupplierChange}
          suppliers={suppliers}
          selectedSupplier={selectedSupplier}
        />

        {/* Entry mode + picker */}
        {selectedSupplier ? (
          <>
            <GRNEntryModeTabs
              entryMode={entryMode}
              onChange={handleModeChange}
            />

            {entryMode === "product" ? (
              <GRNProductPicker
                searchTerm={searchTerm}
                onSearchChange={handleSearchChange}
                filteredProducts={filteredProducts}
                onProductClick={handleProductSelectFromModal}
                onBrowseClick={async () => {
                  try {
                    await handleRefreshProducts();
                  } catch (err) {
                    // continue even if refresh fails
                  }
                  setShowProductModal(true);
                }}
              />
            ) : (
              <GRNPurchasePicker
                supplierPurchases={supplierPurchases}
                selectedPurchase={selectedPurchase}
                loadingPurchase={loadingPurchase}
                onPurchaseSelect={handlePurchaseSelect}
              />
            )}
          </>
        ) : (
          <div className="grn-no-supplier">
            <p>Please select a supplier first to add items.</p>
          </div>
        )}

        {/* Details table */}
        <GRNDetailsTable
          details={formData.details}
          activeCount={activeCount}
          voidedCount={voidedCount}
          onDetailChange={handleDetailChange}
          onToggleVoid={toggleVoidDetail}
          calculateDetailTotal={calculateDetailTotal}
        />

        {/* Comments */}
        <GRNComments value={formData.comments} onChange={handleChange} />

        {/* Actions */}
        <div className="form-actions">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            <X size={16} strokeWidth={2} />
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            <Save size={16} strokeWidth={2} />
            {grn ? "Update GRN" : "Save GRN"}
          </button>
        </div>
      </form>

      {/* Item lookup modal */}
      <ItemLookupModal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        onSelectItem={handleProductSelectFromModal}
        items={localProducts}
        selectedItems={formData.details
          .filter((d) => d.rowState !== "Deleted")
          .map((d) => ({ productId: d.productId }))}
        title="Select Products for GRN"
        searchPlaceholder="Search by code, name, or barcode..."
        loading={false}
        emptyMessage="No products found"
        multiSelect={true}
        columns={lookupColumns}
        onRefresh={handleRefreshProducts}
      />

      {/* Confirm dialog */}
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        onClose={() =>
          setConfirmState({ isOpen: false, purchase: null, itemCount: 0 })
        }
        onConfirm={() => applyPurchaseDetails(confirmState.purchase)}
        title="Load All Items?"
        message={`This purchase has ${confirmState.itemCount} items. Load all of them into the GRN?`}
        confirmText="Load All"
        variant="warning"
      />
    </div>
  );
}

export default GRNForm;