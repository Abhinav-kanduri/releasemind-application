import test from "node:test";
import assert from "node:assert/strict";
import {
  hasMeaningfulScores,
  sanitizeAssistantAnswer,
} from "../src/components/assistant/assistant-sanitizer.ts";

test("removes UUIDs and internal database metadata", () => {
  const raw =
    "Project [project.id: abdbbe0d-cadf-456b-ae24-8e7e549036e7, project.project_key: CSA-BOT] project_id: abdbbe0d-cadf-456b-ae24-8e7e549036e7.";
  const answer = sanitizeAssistantAnswer(raw);
  assert.equal(answer.includes("abdbbe0d"), false);
  assert.equal(answer.includes("project.id"), false);
  assert.equal(answer.includes("project_id"), false);
});

test("preserves human-readable ReleaseLens entity keys", () => {
  const answer = sanitizeAssistantAnswer(
    "Feature `CSA-BOT-F-001` contains `CSA-BOT-101`.",
  );
  assert.match(answer, /CSA-BOT-F-001/);
  assert.match(answer, /CSA-BOT-101/);
});

test("hides identical or missing relevance scores", () => {
  assert.equal(hasMeaningfulScores([0.55, 0.55, 0.55]), false);
  assert.equal(hasMeaningfulScores([undefined, undefined]), false);
  assert.equal(hasMeaningfulScores([0.92, 0.71, 0.55]), true);
});
