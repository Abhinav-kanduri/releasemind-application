import { createHash } from "node:crypto";
import type {
  GenerateRemediationPromptOptions,
  GeneratedRemediationPrompt,
  ImpactEvidence,
  ImpactFinding,
  ImpactRequirement,
  ImpactRun,
} from "./types";

const PROMPT_VERSION = "copilot-remediation-v1";

function compact(value: string | null | undefined, limit = 1200) {
  const normalized = value?.replace(/\s+/g, " ").trim() || "Not provided.";
  return normalized.length > limit
    ? `${normalized.slice(0, limit - 1)}?`
    : normalized;
}

function evidenceLine(item: ImpactEvidence) {
  const location = [
    item.file_path,
    item.start_line ? `line ${item.start_line}` : null,
    item.symbol,
  ]
    .filter(Boolean)
    .join(" ? ");
  return `- [${item.type}] ${location || "Persisted evidence"}: ${compact(
    item.description || item.excerpt,
    900,
  )}`;
}

function requirementLine(item: ImpactRequirement) {
  return `- ${item.requirement_id}: ${compact(item.text, 600)}`;
}

export function parseRemediationPromptOptions(
  value: unknown,
): GenerateRemediationPromptOptions {
  if (!value || typeof value !== "object")
    throw new Error("A remediation prompt request body is required.");
  const input = value as Record<string, unknown>;
  if (input.target !== "github_copilot_chat")
    throw new Error("The only supported prompt target is github_copilot_chat.");
  const optionalString = (key: string) => {
    const candidate = input[key];
    if (candidate == null) return null;
    if (typeof candidate !== "string" || !candidate.trim())
      throw new Error(`${key} must be a non-empty string or null.`);
    return candidate.trim();
  };
  return {
    target: "github_copilot_chat",
    target_repository: optionalString("target_repository"),
    target_ref: optionalString("target_ref"),
    include_related_requirements: input.include_related_requirements !== false,
    include_test_plan: input.include_test_plan !== false,
    include_repository_warning: input.include_repository_warning !== false,
  };
}
