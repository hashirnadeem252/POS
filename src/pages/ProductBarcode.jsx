// pages/Products/ProductBarcode.jsx
import { useState, useEffect } from "react";
import JsBarcode from "jsbarcode";
import {
  FileText,
  Search,
  X,
  Check,
  ArrowRight,
  ArrowLeft,
  Printer,
  Package,
  PackageSearch,
  RefreshCw,
  Trash2,
  Barcode,
  Tag,
  Layers,
  Grid3X3,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import ItemLookupModal from "../components/common/ItemLookupModal";
import { useExport } from "../hooks/useExport";
import { getProductsFromIndexedDB } from "../services/indexdb/productService";
import { getProducts } from "../services/ProductDefinition/productService";
import { refreshMasterData } from "../services/masterDataSyncService";
import BarcodePrint from "../components/barcode/BarcodePrint";
import { notify } from "../utils/notify"; 
import "../assets/styles/products/ProductBarcode.css";
import "../assets/styles/barcode/BarcodePrint.css";
import EmptyState from "../components/common/EmptyState";

function ProductBarcode() {
  // =========================
  // STATE
  // =========================
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState([]);
  const [localProducts, setLocalProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showLookupModal, setShowLookupModal] = useState(false);
  const [quantities, setQuantities] = useState({});
  const [loading, setLoading] = useState(true);
  const [generatedLabels, setGeneratedLabels] = useState([]);
  const [showPrintView, setShowPrintView] = useState(false);

  // =========================
  // EXPORT HOOK
  // =========================
  const { handlePrint: handlePrintExport } = useExport({
    title: "🏷️ Barcode Labels",
    subtitle: "Generated from POS System",
    filename: "barcodes",
    headers: ["Code", "Name", "Barcode", "Price", "Quantity"],
    rowMapper: (item) => [
      item.code || "",
      item.name || "",
      item.barcode || "",
      item.price || 0,
      item.quantity || 1,
    ],
  });

  // =========================
  // TEMPLATES
  // =========================
  const templates = [
    {
      id: 1,
      name: "40 / sheet with company name",
      Icon: Grid3X3,
      size: "40 labels",
      desc: "Small labels with company logo",
      config: { cols: 4, rows: 10, labelWidth: 200, labelHeight: 100, gap: 10 },
    },
    {
      id: 2,
      name: "24 / sheet (standard)",
      Icon: Layers,
      size: "24 labels",
      desc: "Standard size labels",
      config: { cols: 3, rows: 8, labelWidth: 250, labelHeight: 120, gap: 12 },
    },
    {
      id: 3,
      name: "12 / sheet (large)",
      Icon: FileText,
      size: "12 labels",
      desc: "Large format labels",
      config: { cols: 2, rows: 6, labelWidth: 300, labelHeight: 150, gap: 15 },
    },
    {
      id: 4,
      name: "6 / sheet (extra large)",
      Icon: FileText,
      size: "6 labels",
      desc: "Extra large labels",
      config: { cols: 1, rows: 6, labelWidth: 400, labelHeight: 200, gap: 20 },
    },
  ];

  // =========================
  // LOAD PRODUCTS
  // =========================
  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setLoading(true);
    try {
      let productData = await getProductsFromIndexedDB();

      if (!productData || productData.length === 0) {
        const apiProducts = await getProducts();
        productData = apiProducts;
      }

      setProducts(productData);
      setLocalProducts(productData);
      setFilteredProducts(productData);
    } catch (error) {
      try {
        const apiProducts = await getProducts();
        setProducts(apiProducts);
        setLocalProducts(apiProducts);
        setFilteredProducts(apiProducts);
      } catch (apiError) {
        setProducts([]);
        setLocalProducts([]);
        setFilteredProducts([]);
      }
    } finally {
      setLoading(false);
    }
  }

  const handleRefreshProducts = async () => {
    try {
      const { products: freshProducts } = await refreshMasterData();
      setLocalProducts(freshProducts);
      setProducts(freshProducts);
      setFilteredProducts(freshProducts);
      return freshProducts;
    } catch (error) {
      notify.error("Failed to refresh product list. Please try again.");
      throw error;
    }
  };

  // =========================
  // BARCODE HELPERS
  // =========================
  function getBarcodeFormat(code) {
    if (/^\d{13}$/.test(code)) return "EAN13";
    if (/^\d{12}$/.test(code)) return "UPC";
    if (/^\d{8}$/.test(code)) return "EAN8";
    return "CODE128";
  }

  function generateFallbackBarcode() {
    const random12 = Math.floor(100000000000 + Math.random() * 900000000000);
    const barcode12 = random12.toString();
    let sum = 0;
    for (let i = 0; i < barcode12.length; i++) {
      sum += parseInt(barcode12[i], 10) * (i % 2 === 0 ? 1 : 3);
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return barcode12 + checkDigit;
  }

  function generateBarcodeSVG(value, width = 200, height = 80) {
    const code = (value || generateFallbackBarcode()).toString();
    const format = getBarcodeFormat(code);

    const svgNode = document.createElementNS("http://www.w3.org/2000/svg", "svg");

    try {
      JsBarcode(svgNode, code, {
        format,
        width: 2,
        height: Math.max(height - 30, 30),
        displayValue: true,
        fontSize: 12,
        font: "monospace",
        textMargin: 2,
        margin: 8,
        background: "#ffffff",
        lineColor: "#000000",
      });
    } catch (err) {
      try {
        JsBarcode(svgNode, code, {
          format: "CODE128",
          width: 2,
          height: Math.max(height - 30, 30),
          displayValue: true,
          fontSize: 12,
          font: "monospace",
          textMargin: 2,
          margin: 8,
          background: "#ffffff",
          lineColor: "#000000",
        });
      } catch (fallbackErr) {
        return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
          <rect width="${width}" height="${height}" fill="#fff" stroke="#ccc"/>
          <text x="${width / 2}" y="${height / 2}" text-anchor="middle" font-size="11" fill="#c00">Invalid barcode</text>
        </svg>`;
      }
    }

    svgNode.setAttribute("width", width);
    svgNode.setAttribute("height", height);
    svgNode.style.display = "block";
    svgNode.style.margin = "0 auto";
    svgNode.style.maxWidth = "100%";

    return svgNode.outerHTML;
  }

  // =========================
  // HANDLERS
  // =========================
  function handleTemplateSelect(template) {
    setSelectedTemplate(template);
  }

  function handleSearchChange(event) {
    const term = event.target.value;
    setSearchTerm(term);
    const filtered = products.filter(
      (p) =>
        p.code?.toLowerCase().includes(term.toLowerCase()) ||
        p.name?.toLowerCase().includes(term.toLowerCase()) ||
        p.barcode?.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredProducts(filtered);
  }

  const handleItemSelectFromModal = (product, selected) => {
    if (selected) {
      if (!selectedItems.find((item) => item.productId === product.productId)) {
        setSelectedItems([
          ...selectedItems,
          {
            ...product,
            quantity: 1,
            price: product.retailPrice || product.price || 0,
            barcode: product.barcode || generateFallbackBarcode(),
          },
        ]);
        setQuantities({ ...quantities, [product.productId]: 1 });
      }
    } else {
      handleRemoveItem(product.productId);
    }
  };

function handleItemSelect(product) {
  if (!selectedItems.find((item) => item.productId === product.productId)) {
    setSelectedItems([...selectedItems, { ...product, quantity: 1 }]);
    setQuantities({ ...quantities, [product.productId]: 1 });
  }
  setSearchTerm("");
  setFilteredProducts(products);
  setShowLookupModal(false);
  
  // ✅ Keep focus on the search bar for the next scan
  setTimeout(() => {
    document.querySelector('.search-input-wrapper .input')?.focus();
  }, 100);
}

  function handleRemoveItem(productId) {
    setSelectedItems(selectedItems.filter((item) => item.productId !== productId));
    const newQuantities = { ...quantities };
    delete newQuantities[productId];
    setQuantities(newQuantities);
  }

  function handleQuantityChange(productId, value) {
    const qty = Math.max(1, parseInt(value, 10) || 1);
    setQuantities({ ...quantities, [productId]: qty });
    setSelectedItems(
      selectedItems.map((item) => (item.productId === productId ? { ...item, quantity: qty } : item))
    );
  }

  function handleNextStep() {
    if (currentStep === 0 && !selectedTemplate) {
      notify.warning("Please select a template first.");
      return;
    }
    if (currentStep === 1 && selectedItems.length === 0) {
      notify.warning("Please select at least one item.");
      return;
    }
    setCurrentStep(currentStep + 1);
  }

  function handlePreviousStep() {
    setCurrentStep(currentStep - 1);
  }

 function generateAllLabels() {
  if (selectedItems.length === 0) {
    notify.warning("No items selected. Please add items first.");
    return;
  }

  const template = selectedTemplate || templates[0];
  const config = template.config;
  let allLabels = [];

  selectedItems.forEach((item) => {
    const qty = quantities[item.productId] || 1;
    for (let i = 0; i < qty; i++) {
      const barcodeValue = item.barcode || generateFallbackBarcode();
      const barcodeSVG = generateBarcodeSVG(barcodeValue, config.labelWidth, 90);
      allLabels.push({
        ...item,
        barcodeSVG,
        barcodeValue,
        labelIndex: i + 1,
      });
    }
  });

  setGeneratedLabels(allLabels);

  // ✅ Directly trigger print — no intermediate preview page
  printLabels(allLabels, template);
}

function printLabels(labels, template) {
  if (labels.length === 0) {
    notify.warning("No labels to print.");
    return;
  }

  const printWindow = window.open("", "_blank", "width=1200,height=800");
  if (!printWindow) {
    notify.error("Please allow popups to print.");
    return;
  }

  const config = template.config;
  const gapMm = 2;

  const printContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Barcode Labels</title>
        <style>
          @page { size: A4; margin: 5mm; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; background: white; }
          .label-grid {
            display: grid;
            grid-template-columns: repeat(${config.cols}, 1fr);
            gap: ${gapMm}mm;
            width: 100%;
          }
          .label-item {
            border: 1px dashed #ccc;
            padding: 3px;
            text-align: center;
            background: white;
            page-break-inside: avoid;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            min-height: 30mm;
          }
          .label-item svg { max-width: 100%; height: auto; }
          .label-item .product-name { font-size: 9px; font-weight: 600; margin-top: 3px; color: #000; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%; }
          .label-item .product-price { font-size: 9px; color: #000; font-weight: 500; }
          @media print { .label-item { border: none; } }
        </style>
      </head>
      <body>
        <div class="label-grid">
          ${labels.map((label) => `
            <div class="label-item">
              ${label.barcodeSVG}
              <div class="product-name">${label.name}</div>
              <div class="product-price">PKR ${label.price}</div>
            </div>
          `).join("")}
        </div>
        <script>
          window.onload = function () {
            setTimeout(function () { window.print(); }, 400);
            window.onafterprint = function () { window.close(); };
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(printContent);
  printWindow.document.close();
}

// Keep this for backward compatibility (BarcodePrint.jsx still calls it)
function handlePrint() {
  printLabels(generatedLabels, selectedTemplate || templates[0]);
}

  function handleClearItems() {
    if (selectedItems.length === 0) return;
    if (window.confirm("Clear all selected items?")) {
      setSelectedItems([]);
      setQuantities({});
    }
  }

  // =========================
  // HELPERS
  // =========================
  const getTotalLabels = () => {
    return selectedItems.reduce((sum, item) => sum + (quantities[item.productId] || 1), 0);
  };

  const steps = [
    { number: 1, label: "Select Template", Icon: Layers },
    { number: 2, label: "Select Items", Icon: PackageSearch },
    { number: 3, label: "Print Barcodes", Icon: Printer },
  ];

  const lookupColumns = [
    { key: "code", label: "Code" },
    { key: "name", label: "Name" },
    {
      key: "barcode",
      label: "Barcode",
      render: (item) => item.barcode || "-",
    },
    {
      key: "price",
      label: "Price",
      className: "numeric",
      render: (item) => `PKR ${item.retailPrice || item.price || 0}`,
    },
  ];

  // =========================
  // LOADING STATE
  // =========================
  if (loading) {
    return (
      <div className="product-barcode-page">
        <div className="loading-state">
          <Loader2 size={40} className="spinning" />
          <h3>Loading Products...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="product-barcode-page">
      {/* ===== Steps Indicator ===== */}
      <div className="steps-indicator">
        {steps.map((step, index) => {
          const StepIcon = step.Icon;
          const isActive = currentStep === index;
          const isCompleted = currentStep > index;

          return (
            <div key={index} className="step-wrapper">
              <div
                className={`step-item ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""}`}
              >
                <span className="step-number">
                  {isCompleted ? (
                    <Check size={16} strokeWidth={3} />
                  ) : (
                    <StepIcon size={16} strokeWidth={2} />
                  )}
                </span>
                <span className="step-label">{step.label}</span>
              </div>
              {index < steps.length - 1 && (
                <div className={`step-connector ${isCompleted ? "completed" : ""}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* ===== STEP 1: TEMPLATE SELECTOR ===== */}
      {currentStep === 0 && !showPrintView && (
        <div className="step-content">
          <div className="step-header">
            <h2>
              <Layers size={20} strokeWidth={2} />
              Step 1 - Select a barcode template
            </h2>
            <p className="step-description">
              The selected template determines how barcodes will be arranged on the printed sheet.
            </p>
          </div>

          <div className="template-grid">
            {templates.map((template) => {
              const TemplateIcon = template.Icon;
              const isSelected = selectedTemplate?.id === template.id;
              return (
                <div
                  key={template.id}
                  className={`template-card ${isSelected ? "selected" : ""}`}
                  onClick={() => handleTemplateSelect(template)}
                >
                  {isSelected && (
                    <div className="template-check">
                      <CheckCircle2 size={20} strokeWidth={2} />
                    </div>
                  )}
                  <div className="template-icon">
                    <TemplateIcon size={28} strokeWidth={1.75} />
                  </div>
                  <div className="template-name">{template.name}</div>
                  <div className="template-size">{template.size}</div>
                  <div className="template-desc">{template.desc}</div>
                </div>
              );
            })}
          </div>

          <div className="step-actions">
            <span className="selection-info">
              {selectedTemplate ? (
                <>
                  <CheckCircle2 size={16} strokeWidth={2} />
                  Selected: {selectedTemplate.name}
                </>
              ) : (
                <>
                  <AlertCircle size={16} strokeWidth={2} />
                  Please select a template to continue
                </>
              )}
            </span>
            <button className="btn btn-primary" onClick={handleNextStep}>
              Move Next
              <ArrowRight size={16} strokeWidth={2} />
            </button>
          </div>
        </div>
      )}

      {/* ===== STEP 2: ITEM SELECTOR ===== */}
      {currentStep === 1 && !showPrintView && (
        <div className="step-content">
          <div className="step-header">
            <h2>
              <PackageSearch size={20} strokeWidth={2} />
              Step 2 - Select items for barcode printing
            </h2>
            <p className="step-description">
              Search, scan, or select items from the list to print barcodes.
            </p>
          </div>

          <div className="item-selector">
        <div className="search-input-wrapper">
  <Search size={16} strokeWidth={2} />
  <input
    type="text"
    className="input"
    placeholder="Scan barcode or type item code..."
    value={searchTerm}
    onChange={handleSearchChange}
    onKeyDown={(e) => {
      if (e.key === "Enter" && searchTerm.trim()) {
        e.preventDefault();
        const term = searchTerm.trim().toLowerCase();
        
        // 1. Try exact match on code or barcode first (scanner behavior)
        const exactMatch = products.find(
          (p) =>
            p.code?.toLowerCase() === term ||
            p.barcode?.toLowerCase() === term
        );

        if (exactMatch) {
          handleItemSelect(exactMatch);
          return;
        }

        // 2. If only one filtered result exists, pick it
        if (filteredProducts.length === 1) {
          handleItemSelect(filteredProducts[0]);
          return;
        }

        // 3. If multiple results, warn the cashier
        if (filteredProducts.length > 1) {
          notify.info(`${filteredProducts.length} matches found. Click one to select.`);
        } else {
          notify.warning("No product found for that code.");
        }
      }
    }}
  />
</div>
            <button className="btn btn-primary" onClick={() => setShowLookupModal(true)}>
              <Search size={16} strokeWidth={2} />
              Lookup
            </button>
          </div>

          {/* Quick Search Results */}
          {searchTerm && filteredProducts.length > 0 && (
            <div className="quick-results">
              {filteredProducts.slice(0, 5).map((product) => (
                <div
                  key={product.productId}
                  className="quick-result-item"
                  onClick={() => handleItemSelect(product)}
                >
                  <span className="quick-result-info">
                    <strong>{product.code}</strong>
                    <span className="quick-result-name">{product.name}</span>
                  </span>
                  <span className="quick-result-price">
                    PKR {product.retailPrice || product.price || 0}
                    {product.barcode && <Barcode size={14} strokeWidth={1.75} />}
                  </span>
                </div>
              ))}
              {filteredProducts.length > 5 && (
                <div className="quick-results-more">
                  + {filteredProducts.length - 5} more results. Click "Lookup" to see all.
                </div>
              )}
            </div>
          )}

          {/* Selected Items Table */}
          {selectedItems.length > 0 && (
            <div className="selected-items-table">
              <div className="selected-header">
                <h3>
                  <CheckCircle2 size={18} strokeWidth={2} />
                  Selected Items ({selectedItems.length})
                </h3>
                <div className="selected-header-actions">
                  <span className="label-count">
                    Total Labels: <strong>{getTotalLabels()}</strong>
                  </span>
                  <button className="btn btn-outline btn-sm" onClick={handleClearItems}>
                    <Trash2 size={14} strokeWidth={2} />
                    Clear All
                  </button>
                </div>
              </div>

              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Item Code</th>
                      <th>Item Name</th>
                      <th>Barcode</th>
                      <th>Price</th>
                      <th>Quantity</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedItems.map((item) => (
                      <tr key={item.productId}>
                        <td>
                          <strong>{item.code}</strong>
                        </td>
                        <td>{item.name}</td>
                        <td className="barcode-cell">{item.barcode || "N/A"}</td>
                        <td className="numeric">PKR {item.price || item.retailPrice || 0}</td>
                        <td>
                          <input
                            type="number"
                            className="quantity-input"
                            value={quantities[item.productId] || 1}
                            min="1"
                            onChange={(e) => handleQuantityChange(item.productId, e.target.value)}
                          />
                        </td>
                        <td>
                          <button
                            className="btn-icon-danger"
                            onClick={() => handleRemoveItem(item.productId)}
                            title="Remove"
                          >
                            <X size={14} strokeWidth={2.5} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Empty State */}
          {selectedItems.length === 0 && !searchTerm && (
            <EmptyState
              icon={<Package size={48} strokeWidth={1.25} />}
              title="No Items Selected"
              description='Start typing an item code above or click "Lookup" to browse products.'
            />
          )}

          <div className="step-actions">
            <button className="btn btn-outline" onClick={handlePreviousStep}>
              <ArrowLeft size={16} strokeWidth={2} />
              Back
            </button>
            <button
              className="btn btn-primary"
              onClick={handleNextStep}
              disabled={selectedItems.length === 0}
            >
              Print Barcodes
              <ArrowRight size={16} strokeWidth={2} />
            </button>
          </div>
        </div>
      )}

      {/* ===== STEP 3: PRINT PREVIEW ===== */}
      {currentStep === 2 && !showPrintView && (
        <div className="step-content">
          <div className="step-header">
            <h2>
              <Printer size={20} strokeWidth={2} />
              Step 3 - Preview & Print Barcodes
            </h2>
            <p className="step-description">
              Review your selected items and quantities before printing.
            </p>
          </div>

          <div className="preview-summary">
            <div className="summary-item">
              <span className="summary-label">Template</span>
              <span className="summary-value">{selectedTemplate?.name}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Total Labels</span>
              <span className="summary-value highlight">{getTotalLabels()}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Unique Items</span>
              <span className="summary-value">{selectedItems.length}</span>
            </div>
          </div>

          {/* Barcode Preview */}
          <div className="barcode-preview-grid">
            {selectedItems.map((item) => {
              const qty = quantities[item.productId] || 1;
              const displayCount = Math.min(qty, 6);
              return Array.from({ length: displayCount }).map((_, i) => {
                const barcodeValue = item.barcode || generateFallbackBarcode();
                const barcodeSVG = generateBarcodeSVG(barcodeValue, 200, 80);
                return (
                  <div key={`${item.productId}-${i}`} className="barcode-preview-item">
                    <div className="barcode-svg-wrapper" dangerouslySetInnerHTML={{ __html: barcodeSVG }} />
                    <div className="barcode-item-code">{item.code}</div>
                    <div className="barcode-item-name">{item.name}</div>
                    <div className="barcode-item-meta">
                      <span>PKR {item.price || item.retailPrice || 0}</span>
                      <span className="barcode-index">
                        #{i + 1}/{qty}
                      </span>
                    </div>
                  </div>
                );
              });
            })}
          </div>

          {getTotalLabels() > 6 && (
            <div className="more-labels-notice">
              + {getTotalLabels() - 6} more labels will be generated
            </div>
          )}

          <div className="step-actions">
            <button className="btn btn-outline" onClick={handlePreviousStep}>
              <ArrowLeft size={16} strokeWidth={2} />
              Back
            </button>
            <button className="btn btn-success" onClick={generateAllLabels}>
              <Printer size={16} strokeWidth={2} />
              Generate & Print
            </button>
          </div>
        </div>
      )}

      {/* ===== PRINT VIEW ===== */}
      {showPrintView && (
        <BarcodePrint
          labels={generatedLabels}
          template={selectedTemplate || templates[0]}
          onPrint={handlePrint}
          onBack={() => {
            setShowPrintView(false);
            setCurrentStep(2);
          }}
        />
      )}

      {/* ===== ITEM LOOKUP MODAL ===== */}
      <ItemLookupModal
        isOpen={showLookupModal}
        onClose={() => setShowLookupModal(false)}
        onSelectItem={handleItemSelectFromModal}
        items={localProducts}
        selectedItems={selectedItems}
        title="Select Products for Barcode Printing"
        searchPlaceholder="Search by code, name, or barcode..."
        loading={loading}
        emptyMessage="No products found"
        multiSelect={true}
        columns={lookupColumns}
        onRefresh={handleRefreshProducts}
      />
    </div>
  );
}

export default ProductBarcode;