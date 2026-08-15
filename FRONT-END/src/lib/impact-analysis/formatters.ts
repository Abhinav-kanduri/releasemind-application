export function impactLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatPercent(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "Unavailable";
  const normalized = value <= 1 ? value * 100 : value;
  return `${Math.round(normalized)}%`;
}

export function formatScore(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "Unavailable";
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function safeCsvCell(value: unknown) {
  let content = String(value ?? "");
  if (/^[=+\-@\t\r]/.test(content)) content = `'${content}`;
  return `"${content.replaceAll('"', '""')}"`;
}
