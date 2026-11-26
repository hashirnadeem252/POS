// pages/Products/ProductDefinition.jsx
import { useEffect, useState, useMemo } from "react";
import { UploadCloud } from "lucide-react";
import {
  List,
  FileEdit,
  Plus,
  Edit,
  Trash2,
  FolderOpen,
  Tag,
  Ruler,
  Settings,
} from "lucide-react";
import DataTable from "../components/common/DataTable.jsx";
import PageTabs from "../components/common/PageTabs.jsx";
import MasterDataDropdown from "../components/common/MasterDataDropdown.jsx";
import SearchBar from "../components/common/SearchBar.jsx";
import SearchToolbar from "../components/common/SearchToolbar.jsx";
import useSearch from "../hooks/useSearch.js";
import { useExport, exportConfigs } from "../hooks/useExport.js";
import ProductForm from "../components/products/ProductForm.jsx";
import MasterDataModal from "../components/common/MasterDataModal.jsx";
import MasterDataManager from "../components/common/MasterDataManager.jsx";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  refreshProductCache,
} from "../services/ProductDefinition/productService.js";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../services/CategoryDefinition/categoryService.js";
import {
  getBrands,
  createBrand,
  updateBrand,
  deleteBrand,
} from "../services/BrandDefinition/brandService.js";
import {
  getUnits,
  createUnit,
  updateUnit,
  deleteUnit,
} from "../services/UnitDefinition/unitService.js";
import {
  productBaseColumns,
  productExtraColumns,
} from "../models/productColumns.jsx";
import { getSearchFields } from "../models/productSearchFields.js";
import { notify } from "../utils/notify"; 
import ImportProductsModal from "../components/products/ImportProductsModal";
import "../assets/styles/products/ProductDefinition.css";

function ProductDefinition() {
  // =========================
  // STATE
  // =========================
  const [activeTab, setActiveTab] = useState(0);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showMasterModal, setShowMasterModal] = useState(false);
  const [masterModalType, setMasterModalType] = useState("");
  const [masterInitialName, setMasterInitialName] = useState("");
  const [masterSelection, setMasterSelection] = useState(null);
  const [showMasterManager, setShowMasterManager] = useState(false);
  const [managerType, setManagerType] = useState("");
  const [showExtraColumns, setShowExtraColumns] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [units, setUnits] = useState([]);

  // =========================
  // SEARCH HOOK
  // =========================
  const {
    filters,
    filteredData,
    showSearch,
    activeFilterCount,
    handleFilterChange,
    handleSearch,
    handleReset,
    toggleSearch,
  } = useSearch({
    data: products,
    initialFilters: {
      code: "",
      name: "",
      categoryId: "",
      brandId: "",
    },
    searchFields: [
      { name: "code", getValue: (item) => item.code },
      { name: "name", getValue: (item) => item.name },
      {
        name: "categoryId",
        type: "exact",
        getValue: (item) => item.categoryId,
      },
      {
        name: "brandId",
        type: "exact",
        getValue: (item) => item.brandId,
      },
    ],
  });

  // =========================
  // EXPORT HOOK
  // =========================
  const { handlePrint, handleExportCSV } = useExport({
    config: exportConfigs.products,
  });

  // =========================
  // COMPUTED COLUMNS
  // =========================
  const columns = useMemo(() => {
    const base = [...productBaseColumns];
    if (showExtraColumns) {
      return [...base, ...productExtraColumns];
    }
    return base;
  }, [showExtraColumns]);

  // =========================
  // LOAD DATA
  // =========================
  useEffect(() => {
    loadProducts();
    loadCategories();
    loadBrands();
    loadUnits();
  }, []);

  async function loadProducts(forceRefresh = false) {
    try {
      const data = await getProducts(forceRefresh);
      setProducts(data);
    } catch (error) {
      console.error("Error loading products:", error);
    }
  }

  async function loadCategories() {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  }

  async function loadBrands() {
    try {
      const data = await getBrands();
      setBrands(data);
    } catch (error) {
      console.error("Error loading brands:", error);
    }
  }

  async function loadUnits() {
    try {
      const data = await getUnits();
      setUnits(data);
    } catch (error) {
      console.error("Error loading units:", error);
    }
  }

  // =========================
  // HANDLERS
  // =========================
  function handleAddProduct() {
    setEditingProduct(null);
    setActiveTab(1);
  }

  function handleEditProduct(product) {
    setEditingProduct(product);
    setActiveTab(1);
  }

  function handleRowDoubleClick(product) {
    handleEditProduct(product);
  }

  async function handleSave(formData) {
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.productId, formData);
      } else {
        await createProduct(formData);
      }

      const updatedProducts = await refreshProductCache();
      setProducts(updatedProducts);

      setActiveTab(0);
      setEditingProduct(null);
    } catch (error) {
      console.error("Error saving product:", error);
      notify.error("Failed to save product. Please try again.");
    }
  }

  function handleCancel() {
    setActiveTab(0);
    setEditingProduct(null);
  }

  // =========================
  // DELETE PRODUCT
  // =========================
  async function handleDeleteProduct(product) {
    if (!product) {
      notify.warning("Product not found.");
      return;
    }

    const productName = product.name || "Unnamed Product";
    const productCode = product.code || "N/A";
    const productId = product.productId;
    const isActive = product.isActive === true || product.isActive === 1;

    const message = isActive
      ? `⚠️ Delete "${productName}" (${productCode})?\n\n` +
        `• If used in transactions → Marked as INACTIVE\n` +
        `• If not used → Permanently DELETED`
      : `"${productName}" (${productCode}) is already INACTIVE.\n\n` +
        `Permanently delete? ⚠️ Cannot be undone.`;

    if (!window.confirm(message)) return;

    try {
      await deleteProduct(productId);
      const updatedProducts = await refreshProductCache();
      setProducts(updatedProducts);
      notify.success("✅ Product processed successfully!");
    } catch (error) {
      console.error("Delete error:", error);

      if (
        error.message?.includes("REFERENCE") ||
        error.message?.includes("foreign")
      ) {
        notify.warning("Product is in use and has been marked as INACTIVE.");
        const updatedProducts = await refreshProductCache();
        setProducts(updatedProducts);
      } else {
        notify.error(`❌ Failed: ${error.message || "Please try again"}`);
      }
    }
  }

  // =========================
  // EXTRA COLUMNS TOGGLE
  // =========================
  function toggleExtraColumns() {
    setShowExtraColumns(!showExtraColumns);
  }

  // =========================
  // MASTER DATA HANDLERS
  // =========================
  function openMasterModal(type, initialName = "") {
    setMasterModalType(type);
    setMasterInitialName(initialName);
    setShowMasterModal(true);
  }

  function openMasterManager(type) {
    setManagerType(type);
    setShowMasterManager(true);
  }

  async function refreshManagerData(type = managerType) {
    if (type === "category") await loadCategories();
    if (type === "brand") await loadBrands();
    if (type === "unit") await loadUnits();
  }

  async function handleManagerCreate(data) {
    let result;
    if (managerType === "category") result = await createCategory(data);
    if (managerType === "brand") result = await createBrand(data);
    if (managerType === "unit") result = await createUnit(data);
    await refreshManagerData();
    notify.success(`${managerType} added successfully!`);
    return result;
  }

  async function handleManagerUpdate(id, data) {
    if (managerType === "category") await updateCategory(id, data);
    if (managerType === "brand") await updateBrand(id, data);
    if (managerType === "unit") await updateUnit(id, data);
    await refreshManagerData();
    notify.success(`${managerType} updated successfully!`);
  }

  async function handleManagerDelete(id) {
    if (managerType === "category") await deleteCategory(id);
    if (managerType === "brand") await deleteBrand(id);
    if (managerType === "unit") await deleteUnit(id);
    await refreshManagerData();
    notify.success(`${managerType} deleted successfully!`);
  }

  async function handleMasterSave(data) {
    try {
      let result;
      switch (masterModalType) {
        case "category":
          result = await createCategory(data);
          await loadCategories();
          setMasterSelection({ type: "category", id: result?.categoryId ?? result?.CategoryId ?? result });
          break;
        case "brand":
          result = await createBrand(data);
          await loadBrands();
          setMasterSelection({ type: "brand", id: result?.brandId ?? result?.BrandId ?? result });
          break;
        case "unit":
          result = await createUnit(data);
          await loadUnits();
          setMasterSelection({ type: "unit", id: result?.unitId ?? result?.UnitId ?? result });
          break;
        default:
          break;
      }
      notify.success(
        `${masterModalType.charAt(0).toUpperCase() + masterModalType.slice(1)} added successfully!`
      );
      return result;
    } catch (error) {
      console.error("Error adding master data:", error);
      throw error;
    }
  }

  // =========================
  // RENDER CONFIG
  // =========================
  const tabs = [
    { id: 0, label: "All Products", icon: List },
    { id: 1, label: "Product Definition", icon: FileEdit },
  ];

  const tableActions = [
    {
      icon: <Edit size={14} strokeWidth={2} />,
      onClick: handleEditProduct,
      title: "Edit Product",
      className: "btn-outline",
    },
    {
      icon: <Trash2 size={14} strokeWidth={2} />,
      onClick: handleDeleteProduct,
      title: "Delete Product",
      className: "btn-danger",
    },
  ];

  const masterDataItems = [
    {
      key: "category",
      icon: <FolderOpen size={16} strokeWidth={1.75} />,
      title: "Manage Categories",
      description: "Add, edit or delete categories",
    },
    {
      key: "brand",
      icon: <Tag size={16} strokeWidth={1.75} />,
      title: "Manage Brands",
      description: "Add, edit or delete brands",
      divider: true,
    },
    {
      key: "unit",
      icon: <Ruler size={16} strokeWidth={1.75} />,
      title: "Manage Units",
      description: "Add, edit or delete units",
    },
  ];

  const searchFields = getSearchFields(categories, brands);

  return (
    <div className="product-definition">
      <PageTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onAddClick={handleAddProduct}
        addButtonLabel="Add Product"
        addButtonIcon={Plus}
             extraActions={
          <div style={{ display: "flex", gap: "12px" }}>
            <button 
              className="btn btn-outline" 
              onClick={() => setShowImportModal(true)}
              style={{ display: "flex", alignItems: "center", gap: "6px", height: "38px" }}
            >
              <UploadCloud size={16} /> Import
            </button>
            <MasterDataDropdown
              items={masterDataItems}
              onItemClick={(item) => openMasterManager(item.key)}
              buttonLabel="Manage"
            />
          </div>
        }
      >
        {/* Tab 0: All Products */}
        <div>
          <SearchToolbar
            showSearch={showSearch}
            onToggleSearch={toggleSearch}
            activeFilterCount={activeFilterCount}
            showExtraColumns={showExtraColumns}
            onToggleExtraColumns={toggleExtraColumns}
            extraColumnsCount={2}
            onPrint={() => handlePrint(filteredData)}
            onExportCSV={() => handleExportCSV(filteredData)}
          />

          <SearchBar
            fields={searchFields}
            filters={filters}
            onFilterChange={handleFilterChange}
            onSearch={handleSearch}
            onReset={handleReset}
            isOpen={showSearch}
          />

          <DataTable
            data={filteredData}
            columns={columns}
            actions={tableActions}
            onRowDoubleClick={handleRowDoubleClick}
            defaultPageSize={10}
            emptyMessage="No products found"
          />

          <span className="results-count">
            Showing {filteredData.length} of {products.length} products
            {activeFilterCount > 0 && (
              <span className="filter-info">
                {" "}
                (Filtered by {activeFilterCount} criteria)
              </span>
            )}
          </span>
        </div>

        {/* Tab 1: Product Definition (Form) */}
        <div>
          <ProductForm
            product={editingProduct}
            categories={categories}
            brands={brands}
            units={units}
            masterSelection={masterSelection}
            onAddCategory={(initialName) => openMasterModal("category", initialName)}
            onAddBrand={(initialName) => openMasterModal("brand", initialName)}
            onAddUnit={(initialName) => openMasterModal("unit", initialName)}
            onClose={handleCancel}
            onSave={handleSave}
          />
        </div>
      </PageTabs>

      {/* Master Data Modal */}
      {showMasterModal && (
        <MasterDataModal
          type={masterModalType}
          initialName={masterInitialName}
          onClose={() => {
            setShowMasterModal(false);
            setMasterModalType("");
            setMasterInitialName("");
          }}
          onSave={handleMasterSave}
        />
        
      )}

      {/* Master Data Manager */}
      {showMasterManager && (
        <MasterDataManager
          type={managerType}
          items={
            managerType === "category" ? categories :
            managerType === "brand" ? brands : units
          }
          onClose={() => setShowMasterManager(false)}
          onCreate={handleManagerCreate}
          onUpdate={handleManagerUpdate}
          onDelete={handleManagerDelete}
        />
      )}

            {/* Import Products Modal */}
      <ImportProductsModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportSuccess={() => loadProducts(true)} // Force refresh from backend
        existingProducts={products}
      />
    </div>
  );
}

export default ProductDefinition;