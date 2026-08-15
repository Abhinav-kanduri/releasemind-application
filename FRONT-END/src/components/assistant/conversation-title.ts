export function conversationTitle(value?: string | null): string {
  const raw = (value || "").trim();
  if (!raw) return "New conversation";
  const normalized = raw.toLowerCase();
  if (normalized.includes("executive summary")) return "Executive Summary";
  if (normalized.includes("delivery risk") || normalized.includes("at risk"))
    return "Delivery Risks";
  if (normalized.includes("active pi") && normalized.includes("feature"))
    return "Active PI Features";
  if (normalized.includes("list of functions") || normalized.includes("functions"))
    return "Project Functions";
  if (normalized.includes("current backlog") || normalized.includes("backlog"))
    return "Backlog Overview";
  return raw.length > 48 ? `${raw.slice(0, 45).trimEnd()}…` : raw;
}
