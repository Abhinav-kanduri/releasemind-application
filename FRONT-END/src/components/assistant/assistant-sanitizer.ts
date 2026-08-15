const UUID_PATTERN =
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi;
const INTERNAL_LABEL =
  /\b(?:project|projects|feature|features|story|stories)\.(?:id|project_key|feature_key|story_key|name)\s*:\s*[^,;\]\n}]+[,;]?\s*/gi;
const INTERNAL_BRACKET =
  /\s*\[[^\]\n]*(?:\bid\b|product_space_id|project_id|release_id|feature_id|sprint_id|user_story_id|project_key|feature_key|story_key|story_points|sample ids?|releases)\s*:[^\]\n]*\]/gi;

function withoutDuplicateHeadings(value: string): string {
  let previousHeading = "";
  return value
    .split(/\r?\n/)
    .filter((line) => {
      const match = line.trim().match(/^#{1,6}\s+(.+)$/);
      if (!match) {
        if (line.trim()) previousHeading = "";
        return true;
      }
      const heading = match[1].replace(/[*_`]/g, "").trim().toLowerCase();
      if (heading === previousHeading) return false;
      previousHeading = heading;
      return true;
    })
    .join("\n");
}

export function sanitizeAssistantAnswer(answer: string): string {
  const cleaned = answer
    .replace(UUID_PATTERN, "")
    .replace(INTERNAL_LABEL, "")
    .replace(INTERNAL_BRACKET, "")
    .replace(
      /\{[^\n{}]*(?:\bid\b|product_space_id|project_id|release_id|feature_id|project_key|feature_key|story_key|story_points)\s*:[^\n{}]*\}/gi,
      "",
    )
    .replace(
      /\b(?:product_space_id|project_id|release_id|feature_id|sprint_id|user_story_id|project_key|feature_key|story_key|story_points)\s*:\s*[^,;\]\n}]+[,;]?\s*/gi,
      "",
    )
    .replace(/\{\s*[,;]*\s*\}/g, "")
    .replace(/\[\s*[,;]*\s*\]/g, "")
    .replace(/[ \t]+([,.;:])/g, "$1")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return withoutDuplicateHeadings(cleaned);
}

export function hasMeaningfulScores(
  scores: Array<number | undefined>,
): boolean {
  const usable = scores.filter(
    (score): score is number => typeof score === "number" && score > 0,
  );
  return (
    usable.length > 0 &&
    new Set(usable.map((score) => score.toFixed(3))).size > 1
  );
}