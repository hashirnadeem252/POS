import SpreadsheetImportModal from "../common/SpreadsheetImportModal";
import { importProductsCsv } from "../../services/ProductDefinition/productService";
import { productImportFields } from "../../utils/importTemplates";
import { serializeCsv } from "../../utils/spreadsheetImport";

export default function ImportProductsModal({
  isOpen,
  onClose,
  onImportSuccess,
  existingProducts = [],
}) {
  async function importRows(rows) {
    const headers = productImportFields.map((field) => field.header);
    const records = rows.map(({ record }) =>
      Object.fromEntries(
        productImportFields.map((field) => [field.header, record[field.key]])
      )
    );
    const response = await importProductsCsv(serializeCsv(headers, records));
    const failures = Array.isArray(response?.failures)
      ? response.failures.map((failure, index) => ({
          rowNumber: failure.rowNumber ?? rows[index]?.rowNumber ?? "-",
          message: failure.message || "The server rejected this row.",
        }))
      : [];

    return {
      imported:
        response?.importedCount ??
        response?.successCount ??
        Math.max(0, rows.length - failures.length),
      failures,
      message:
        (typeof response === "string" ? response : response?.message) ||
        "Product import completed.",
    };
  }

  return (
    <SpreadsheetImportModal
      isOpen={isOpen}
      onClose={onClose}
      onImport={importRows}
      onImportSuccess={onImportSuccess}
      title="products"
      templateName="product_import_template.csv"
      fields={productImportFields}
      existingRecords={existingProducts}
    />
  );
}
