import fs from "node:fs";
import path from "node:path";
import en from "../src/locales/en.json" with { type: "json" };
import ur from "../src/locales/ur.json" with { type: "json" };

const sourceRoot = path.resolve("src");
const sourceFiles = [];

function collectSourceFiles(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      collectSourceFiles(entryPath);
    } else if (/\.(jsx|js)$/.test(entry.name)) {
      sourceFiles.push(entryPath);
    }
  }
}

function flattenKeys(value, prefix = "") {
  return Object.entries(value).flatMap(([key, child]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    return child && typeof child === "object"
      ? flattenKeys(child, fullKey)
      : [fullKey];
  });
}

collectSourceFiles(sourceRoot);

const referencedKeys = new Set();
const translationCall = /(?:\bi18n\.)?\bt\(\s*["']([^"']+)["']/g;

for (const filePath of sourceFiles) {
  const contents = fs.readFileSync(filePath, "utf8");
  for (const match of contents.matchAll(translationCall)) {
    referencedKeys.add(match[1]);
  }
}

const enKeys = new Set(flattenKeys(en));
const urKeys = new Set(flattenKeys(ur));
const errors = [];

for (const key of referencedKeys) {
  if (!enKeys.has(key)) errors.push(`Missing English translation: ${key}`);
  if (!urKeys.has(key)) errors.push(`Missing Urdu translation: ${key}`);
}

for (const key of enKeys) {
  if (!urKeys.has(key)) errors.push(`Missing Urdu locale key: ${key}`);
}
for (const key of urKeys) {
  if (!enKeys.has(key)) errors.push(`Missing English locale key: ${key}`);
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`i18n check passed (${referencedKeys.size} literal keys, ${enKeys.size} locale keys).`);
}
