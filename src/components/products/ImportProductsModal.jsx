// components/products/ImportProductsModal.jsx
import { useState } from "react";
import { X, UploadCloud, FileSpreadsheet, Download } from "lucide-react";
import { notify } from "../../utils/notify";
import { api } from "../../services/apiClient"; // Assuming you have this

export default function ImportProductsModal({ isOpen, onClose, onImportSuccess }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

const handleFileChange = (e) => {
  if (e.target.files && e.target.files[0]) {
    const selectedFile = e.target.files[0];
    // ✅ Limit to 5MB to prevent server overload
    if (selectedFile.size > 5 * 1024 * 1024) {
      notify.error("File is too large. Maximum size is 5MB.");
      return;
    }
    setFile(selectedFile);
  }
};

  const handleUpload = async () => {
    if (!file) {
      notify.warning("Please select a CSV file first.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      // We use raw fetch here because apiClient might force JSON Content-Type
      const token = localStorage.getItem("pos_auth_token");
      const response = await fetch("https://localhost:7219/api/Products/import", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Import failed");

      notify.success(data.message || "Products imported successfully");
      onImportSuccess(); // Refresh the product list
      onClose();
      setFile(null);
    } catch (err) {
      notify.error(err.message || "Failed to import products");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    // ✅ UPDATED: Using CategoryName instead of CategoryId
    const csvContent = 
      "Name,Code,Barcode,CategoryName,BrandName,UnitName,RetailPrice,CostPrice,MinimumStock\n" +
      "Coca-Cola 500ml,P001,123456789,Beverages,Coca-Cola,Bottle,120,80,10\n" +
      "Lays Chips,P002,987654321,Snacks,Lays,Piece,70,40,15";
      
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "product_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000, padding: "20px" }}>
      <div style={{ background: "#fff", borderRadius: "16px", width: "100%", maxWidth: "500px", padding: "32px", boxShadow: "0 24px 48px rgba(0,0,0,0.2)", position: "relative" }}>
        
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "#F1F5F9", border: "none", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <X size={18} />
        </button>

        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{ width: 64, height: 64, background: "var(--color-primary-soft)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <FileSpreadsheet size={32} color="var(--color-primary)" />
          </div>
          <h2 style={{ fontSize: "22px", fontWeight: 700, margin: "0 0 8px 0", color: "#12203A" }}>Import Products</h2>
          <p style={{ color: "#6B7A8F", fontSize: "14px" }}>Upload a CSV file to add multiple products at once.</p>
        </div>

        <div style={{ background: "var(--color-background)", padding: "16px", borderRadius: "8px", marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)" }}>Need the format?</div>
            <div style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>Download our Excel/CSV template.</div>
          </div>
          <button onClick={handleDownloadTemplate} className="btn btn-outline btn-sm" style={{ display: "flex", gap: "6px" }}>
            <Download size={14} /> Template
          </button>
        </div>

        <label style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "2px dashed #CBD5E1", borderRadius: "12px", padding: "40px 20px", cursor: "pointer", background: file ? "#F0FDF4" : "#F8FAFC", borderColor: file ? "#10B981" : "#CBD5E1", transition: "all 0.2s" }}>
          <input type="file" accept=".csv" onChange={handleFileChange} style={{ display: "none" }} />
          <UploadCloud size={32} color={file ? "#10B981" : "#64748B"} style={{ marginBottom: "12px" }} />
          <span style={{ fontSize: "14px", fontWeight: 600, color: file ? "#166534" : "#64748B" }}>
            {file ? file.name : "Click to browse or drag file here"}
          </span>
          <span style={{ fontSize: "12px", color: "#94A3B8", marginTop: "4px" }}>Only .CSV files are supported</span>
        </label>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
          <button onClick={onClose} className="btn btn-outline" style={{ padding: "10px 20px" }}>Cancel</button>
          <button onClick={handleUpload} disabled={!file || loading} className="btn btn-primary" style={{ padding: "10px 24px", display: "flex", gap: "8px", alignItems: "center" }}>
            {loading ? "Importing..." : "Start Import"} <UploadCloud size={18} />
          </button>
        </div>

      </div>
    </div>
  );
}