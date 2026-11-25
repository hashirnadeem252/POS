import { readSheet } from "read-excel-file/browser";
import {
  getCurrentAuthTenantId,
  requireCurrentAuthTenantId,
} from "./authTenant";

export const MAX_IMPORT_FILE_SIZE = 5 * 1024 * 1024;
export const MAX_IMPORT_ROWS = 500;

const normalizeHeader = (value) =>
  String(value ?? "")
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const normalizeUniqueValue = (value) => String(value ?? "").trim().toLowerCase();

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];

    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        cell += character;
      }
      continue;
    }

    if (character === '"' && cell.length === 0) {
      quoted = true;
    } else if (character === ",") {
      row.push(cell);
      cell = "";
    } else if (character === "\n" || character === "\r") {
      row.push(cell);
      if (row.some((value) => String(value).trim() !== "")) rows.push(row);
      row = [];
      cell = "";
      if (character === "\r" && text[index + 1] === "\n") index += 1;
    } else {
      cell += character;
    }
  }

  if (quoted) throw new Error("The CSV file contains an unclosed quoted value.");
  row.push(cell);
  if (row.some((value) => String(value).trim() !== "")) rows.push(row);
  return rows;
}

export async function readImportFile(file) {
  if (!file) throw new Error("Choose a CSV or XLSX file.");
  if (file.size > MAX_IMPORT_FILE_SIZE) {
    throw new Error("File is too large. Maximum size is 5 MB.");
  }

  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension === "csv") {
    return parseCsv((await file.text()).replace(/^\uFEFF/, ""));
  }
  if (extension === "xlsx") {
    return readSheet(file);
  }

  throw new Error("Use a .csv or .xlsx file. Legacy .xls files are not supported.");
}

export function prepareImportRows(matrix, fields, existingRecords = []) {
  if (!Array.isArray(matrix) || matrix.length < 2) {
    throw new Error("The file must contain column headers and at least one data row.");
  }

  const headers = matrix[0].map(normalizeHeader);
  const columnByField = new Map();
  const missingHeaders = [];

  fields.forEach((field) => {
    const aliases = [field.header, field.key, ...(field.aliases || [])].map(
      normalizeHeader
    );
    const columnIndex = headers.findIndex((header) => aliases.includes(header));
    if (columnIndex < 0 && field.required) {
      missingHeaders.push(field.header);
    } else if (columnIndex >= 0) {
      columnByField.set(field.key, columnIndex);
    }
  });

  if (missingHeaders.length > 0) {
    throw new Error(`Missing required columns: ${missingHeaders.join(", ")}.`);
  }

  const rows = matrix
    .slice(1)
    .map((cells, index) => {
      const values = fields.map((field) => {
        const columnIndex = columnByField.get(field.key);
        const value = columnIndex === undefined ? "" : cells[columnIndex];
        return value == null ? "" : String(value).trim();
      });
      return { rowNumber: index + 2, values };
    })
    .filter(({ values }) => values.some((value) => value !== ""));

  if (rows.length === 0) throw new Error("The file contains no data rows.");
  if (rows.length > MAX_IMPORT_ROWS) {
    throw new Error(`The file has ${rows.length} rows. Import up to ${MAX_IMPORT_ROWS} rows at a time.`);
  }

  const uniqueValues = new Map(
    fields
      .filter((field) => field.unique)
      .map((field) => [
        field.key,
        new Set(
          existingRecords
            .map((record) => normalizeUniqueValue(record?.[field.key]))
            .filter(Boolean)
        ),
      ])
  );

  return rows.map(({ rowNumber, values }) => {
    const record = {};
    const errors = [];

    fields.forEach((field, index) => {
      let value = values[index];
      if (value === "" && field.defaultValue !== undefined) {
        value = String(field.defaultValue);
      }

      if (field.required && !value) {
        errors.push(`${field.label} is required`);
      }
      if (field.type === "number" && value !== "") {
        const number = Number(value);
        if (!Number.isFinite(number) || number < 0) {
          errors.push(`${field.label} must be a non-negative number`);
        } else {
          value = number;
        }
      }
      if (field.type === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        errors.push(`${field.label} is not a valid email address`);
      }

      if (field.unique && value) {
        const normalizedValue = normalizeUniqueValue(value);
        const seenValues = uniqueValues.get(field.key);
        if (seenValues.has(normalizedValue)) {
          errors.push(`${field.label} "${value}" is already in use`);
        } else {
          seenValues.add(normalizedValue);
        }
      }

      record[field.key] = value;
    });

    return { rowNumber, record, errors };
  });
}

export function serializeCsv(headers, records) {
  const quote = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  return [
    headers.map(quote).join(","),
    ...records.map((record) =>
      headers.map((header) => quote(record[header])).join(",")
    ),
  ].join("\r\n");
}

export function downloadCsv(fileName, headers, records) {
  const content = `\uFEFF${serializeCsv(headers, records)}`;
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadCsvTemplate(fileName, headers) {
  downloadCsv(fileName, headers, []);
}

export async function importRowsIndividually(rows, createRecord, mapRecord) {
  const tenantId = requireCurrentAuthTenantId();
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    throw new Error("Connect to the internet before importing records.");
  }

  const failures = [];
  let imported = 0;
  let nextIndex = 0;

  const worker = async () => {
    while (nextIndex < rows.length) {
      const row = rows[nextIndex];
      nextIndex += 1;

      if (getCurrentAuthTenantId() !== tenantId) {
        failures.push({
          rowNumber: row.rowNumber,
          message: "The active shop changed; this row was not submitted.",
        });
        continue;
      }

      try {
        await createRecord(mapRecord(row.record));
        imported += 1;
      } catch (error) {
        failures.push({
          rowNumber: row.rowNumber,
          message: error.message || "The server rejected this row.",
        });
      }
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(4, rows.length) }, () => worker())
  );

  failures.sort((a, b) => a.rowNumber - b.rowNumber);
  return { imported, failures };
}
