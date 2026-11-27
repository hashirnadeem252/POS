const PAKISTAN_TIME_ZONE = "Asia/Karachi";

function parseDateTime(value) {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value !== "string" && typeof value !== "number") return null;

  let normalizedValue = value;
  if (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}[T ]/.test(value) &&
    !/(?:Z|[+-]\d{2}(?::?\d{2})?)$/i.test(value)
  ) {
    // API timestamps without an offset represent UTC values from the database.
    normalizedValue = `${value.replace(" ", "T")}Z`;
  }

  const date = new Date(normalizedValue);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatPakistanDateTime(value, locale = "en-PK") {
  const date = parseDateTime(value);
  if (!date) return "—";

  return new Intl.DateTimeFormat(locale, {
    timeZone: PAKISTAN_TIME_ZONE,
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

export function formatPakistanDate(value, locale = "en-PK") {
  const date = parseDateTime(value);
  if (!date) return "—";

  return new Intl.DateTimeFormat(locale, {
    timeZone: PAKISTAN_TIME_ZONE,
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatPakistanTime(value, locale = "en-PK") {
  const date = parseDateTime(value);
  if (!date) return "—";

  return new Intl.DateTimeFormat(locale, {
    timeZone: PAKISTAN_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function getPakistanDateString(value) {
  const date = parseDateTime(value);
  if (!date) return "";

  const parts = new Intl.DateTimeFormat("en", {
    timeZone: PAKISTAN_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value: part }) => [type, part]));
  return `${values.year}-${values.month}-${values.day}`;
}
