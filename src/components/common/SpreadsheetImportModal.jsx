import { useMemo, useState } from "react";
import { Download, FileSpreadsheet, UploadCloud, X } from "lucide-react";
import {
  downloadCsv,
  downloadCsvTemplate,
  MAX_IMPORT_FILE_SIZE,
  prepareImportRows,
  readImportFile,
} from "../../utils/spreadsheetImport";

const modalStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 10000,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 20,
  background: "rgba(15, 23, 42, 0.7)",
};

const cardStyle = {
  width: "100%",
  maxWidth: 760,
  maxHeight: "90vh",
  overflow: "auto",
  padding: 28,
  borderRadius: 16,
  background: "#fff",
  boxShadow: "0 24px 48px rgba(0,0,0,0.2)",
};

export default function SpreadsheetImportModal({
  isOpen,
  onClose,
  onImport,
  onImportSuccess,
  title,
  templateName,
  fields,
  existingRecords = [],
}) {
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState(null);
  const [parseError, setParseError] = useState("");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  const validRows = useMemo(
    () => (rows || []).filter((row) => row.errors.length === 0),
    [rows]
  );
  const invalidRows = useMemo(
    () => (rows || []).filter((row) => row.errors.length > 0),
    [rows]
  );

  if (!isOpen) return null;

  function reset() {
    setFileName("");
    setRows(null);
    setParseError("");
    setResult(null);
    setBusy(false);
  }

  function handleClose() {
    if (busy) return;
    reset();
    onClose();
  }

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setBusy(true);
    setFileName(file.name);
    setRows(null);
    setParseError("");
    setResult(null);

    try {
      if (file.size > MAX_IMPORT_FILE_SIZE) {
        throw new Error("File is too large. Maximum size is 5 MB.");
      }
      const matrix = await readImportFile(file);
      setRows(prepareImportRows(matrix, fields, existingRecords));
    } catch (error) {
      setParseError(error.message || "Could not read this spreadsheet.");
    } finally {
      setBusy(false);
    }
  }

  async function handleImport() {
    if (validRows.length === 0 || !onImport) return;

    setBusy(true);
    setResult(null);
    try {
      const importResult = await onImport(validRows);
      const completed = {
        imported: importResult?.imported ?? validRows.length,
        failures: importResult?.failures ?? [],
        message: importResult?.message ?? "",
      };
      setResult(completed);
      if (completed.imported > 0 && onImportSuccess) {
        try {
          await onImportSuccess();
        } catch (error) {
          console.error("[SpreadsheetImportModal] Refresh after import failed:", error);
          setResult({
            ...completed,
            message: "Import succeeded, but the list could not be refreshed. Reload the page to see the latest records.",
          });
        }
      }
    } catch (error) {
      setResult({
        imported: 0,
        failures: [{ rowNumber: "-", message: error.message || "Import failed." }],
        message: "",
      });
    } finally {
      setBusy(false);
    }
  }

  function downloadFailedRows() {
    if (!result?.failures?.length) return;
    const headers = [...fields.map((field) => field.header), "ImportError"];
    const failedRecords = result.failures.map((failure) => {
      const sourceRow = rows?.find((row) => row.rowNumber === failure.rowNumber);
      return {
        ...Object.fromEntries(
          fields.map((field) => [field.header, sourceRow?.record[field.key] ?? ""])
        ),
        ImportError: failure.message,
      };
    });
    downloadCsv(
      `${templateName.replace(/\.csv$/i, "")}_failed_rows.csv`,
      headers,
      failedRecords
    );
  }

  const inputStyle = {
    width: "100%",
    padding: "14px 16px",
    border: "1px dashed #94A3B8",
    borderRadius: 10,
    background: "#F8FAFC",
  };

  return (
    <div style={modalStyle} onMouseDown={(event) => {
      if (event.target === event.currentTarget) handleClose();
    }}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="spreadsheet-import-title"
        style={cardStyle}
      >
        <header style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
          <div>
            <h2
              id="spreadsheet-import-title"
              style={{ margin: 0, display: "flex", alignItems: "center", gap: 10 }}
            >
              <FileSpreadsheet size={22} />
              Import {title}
            </h2>
            <p style={{ margin: "8px 0 0", color: "#64748B", fontSize: 14 }}>
              Upload a CSV or XLSX file. The first row must contain the template column names.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleClose}
            disabled={busy}
            aria-label="Close import dialog"
          >
            <X size={18} />
          </button>
        </header>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            marginTop: 22,
            padding: 14,
            borderRadius: 8,
            background: "#F8FAFC",
          }}
        >
          <div>
            <strong style={{ display: "block", fontSize: 14 }}>Prepare your file</strong>
            <span style={{ color: "#64748B", fontSize: 12 }}>
              Use the template headers. Existing codes and duplicate rows are rejected.
            </span>
          </div>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() =>
              downloadCsvTemplate(
                templateName,
                fields.map((field) => field.header)
              )
            }
          >
            <Download size={15} /> CSV template
          </button>
        </div>

        <label style={{ display: "block", marginTop: 18, fontSize: 13, fontWeight: 600 }}>
          Spreadsheet file
          <input
            type="file"
            accept=".csv,.xlsx"
            onChange={handleFileChange}
            disabled={busy}
            style={{ ...inputStyle, display: "block", marginTop: 8 }}
          />
        </label>
        <p style={{ margin: "6px 0 0", fontSize: 12, color: "#64748B" }}>
          {fileName || "Maximum 5 MB; up to 500 non-empty rows per import. Legacy .xls is not supported."}
        </p>

        {busy && (
          <p role="status" style={{ marginTop: 16 }}>
            {rows ? "Importing records..." : "Reading spreadsheet..."}
          </p>
        )}

        {parseError && (
          <p role="alert" style={{ color: "#B91C1C", marginTop: 16 }}>
            {parseError}
          </p>
        )}

        {rows && (
          <div style={{ marginTop: 18 }}>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13 }}>
              <span><strong>{rows.length}</strong> rows found</span>
              <span style={{ color: "#15803D" }}><strong>{validRows.length}</strong> ready to import</span>
              <span style={{ color: invalidRows.length ? "#B91C1C" : "#64748B" }}>
                <strong>{invalidRows.length}</strong> skipped due to validation
              </span>
            </div>
            {invalidRows.length > 0 && (
              <div
                role="alert"
                style={{
                  maxHeight: 140,
                  overflow: "auto",
                  marginTop: 10,
                  padding: 12,
                  borderRadius: 8,
                  background: "#FEF2F2",
                  color: "#991B1B",
                  fontSize: 12,
                }}
              >
                {invalidRows.slice(0, 20).map((row) => (
                  <div key={row.rowNumber}>
                    Row {row.rowNumber}: {row.errors.join("; ")}
                  </div>
                ))}
                {invalidRows.length > 20 && (
                  <div>Plus {invalidRows.length - 20} more invalid rows.</div>
                )}
              </div>
            )}
            {validRows.length > 0 && !result && (
              <div style={{ overflowX: "auto", marginTop: 12 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", padding: 8 }}>Row</th>
                      {fields.slice(0, 4).map((field) => (
                        <th key={field.key} style={{ textAlign: "left", padding: 8 }}>
                          {field.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {validRows.slice(0, 8).map((row) => (
                      <tr key={row.rowNumber}>
                        <td style={{ padding: 8 }}>{row.rowNumber}</td>
                        {fields.slice(0, 4).map((field) => (
                          <td key={field.key} style={{ padding: 8 }}>
                            {String(row.record[field.key] ?? "")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {validRows.length > 8 && (
                  <p style={{ color: "#64748B", fontSize: 12 }}>
                    Previewing 8 of {validRows.length} valid rows.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {result && (
          <div
            role={result.failures.length ? "alert" : "status"}
            style={{
              marginTop: 18,
              padding: 14,
              borderRadius: 8,
              background: result.failures.length ? "#FEF2F2" : "#F0FDF4",
              color: result.failures.length ? "#991B1B" : "#166534",
            }}
          >
            <strong>{result.imported} records imported successfully.</strong>
            {result.message && <p style={{ margin: "6px 0 0" }}>{result.message}</p>}
            {result.failures.length > 0 && (
              <>
                <p style={{ margin: "6px 0" }}>
                  {result.failures.length} rows failed and were not imported.
                </p>
                {result.failures.slice(0, 10).map((failure, index) => (
                  <div key={`${failure.rowNumber}-${index}`} style={{ fontSize: 12 }}>
                    Row {failure.rowNumber}: {failure.message}
                  </div>
                ))}
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  style={{ marginTop: 10 }}
                  onClick={downloadFailedRows}
                >
                  <Download size={14} /> Download failed rows
                </button>
              </>
            )}
          </div>
        )}

        <footer style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 22 }}>
          {result ? (
            <button type="button" className="btn btn-primary" onClick={handleClose}>
              Done
            </button>
          ) : (
            <>
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleClose}
                disabled={busy}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleImport}
                disabled={busy || validRows.length === 0}
              >
                {busy ? "Please wait..." : `Import ${validRows.length} valid rows`}
                {!busy && <UploadCloud size={16} />}
              </button>
            </>
          )}
        </footer>
      </section>
    </div>
  );
}
