import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (relativePath) =>
  readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf8");

const css = read("src/app/chat.css");
const workspace = read("src/components/assistant/chat-workspace.tsx");
const sidebar = read("src/components/assistant/conversation-sidebar.tsx");
const composer = read("src/components/assistant/chat-composer.tsx");
const answer = read("src/components/assistant/assistant-answer.tsx");
const evidence = read("src/components/assistant/evidence-panel.tsx");
const userMessage = read("src/components/assistant/user-message.tsx");
const proxy = read("src/app/api/chat/route.ts");

test("defines the three-region layout and readable message width", () => {
  assert.match(css, /280px minmax\(720px, 1fr\) 360px/);
  assert.match(css, /width: min\(100%, 900px\)/);
  assert.match(css, /max-width: 68%/);
});

test("defines responsive Evidence and conversation drawers", () => {
  assert.match(css, /@media \(max-width: 1599px\)/);
  assert.match(css, /@media \(max-width: 1099px\)/);
  assert.match(css, /@media \(max-width: 767px\)/);
  assert.match(css, /\.conversations\.open/);
  assert.match(css, /\.evidence-panel\s*\{[\s\S]*position: fixed/);
});

test("supports structured Markdown and accessible citations", () => {
  for (const tag of ["<h2", "<h3", "<ul", "<ol", "<table", "<blockquote", "<hr"]) {
    assert.ok(answer.includes(tag), `${tag} support is missing`);
  }
  assert.match(answer, /Open citation \$\{sourceIndex \+ 1\}/);
  assert.match(workspace, /source\?\.focus\(\)/);
  assert.match(workspace, /setEvidenceOpen\(true\)/);
});

test("normalizes current and historical answers in the chat proxy", () => {
  assert.match(proxy, /normalizeChatResponse/);
  assert.match(proxy, /sanitizeAssistantAnswer\(message\.content\)/);
  assert.match(proxy, /body\.answer = sanitizeAssistantAnswer\(body\.answer\)/);
});

test("preserves project isolation and prevents duplicate sends", () => {
  assert.match(workspace, /requestVersionRef/);
  assert.match(workspace, /version !== requestVersionRef\.current/);
  assert.match(workspace, /sendingRef\.current/);
  assert.match(workspace, /setMessages\(\[\]\)/);
});

test("implements composer keyboard and disabled behavior", () => {
  assert.match(composer, /event\.key === "Enter" && !event\.shiftKey/);
  assert.match(composer, /disabled=\{!input\.trim\(\) \|\| sending\}/);
  assert.match(workspace, /Math\.min\(textarea\.scrollHeight, 180\)/);
});

test("keeps Evidence concise and hides unmeaningful scores", () => {
  assert.match(evidence, /hasMeaningfulScores/);
  assert.match(evidence, /aria-expanded=\{expanded\}/);
  assert.match(evidence, /tabIndex=\{-1\}/);
  assert.match(css, /-webkit-line-clamp: 4/);
});

test("exposes selected, live, feedback, and jump-to-latest states", () => {
  assert.match(sidebar, /aria-current/);
  assert.match(workspace, /aria-live="polite"/);
  assert.match(workspace, /jump-to-latest/);
  assert.match(workspace, /Message sent\. ReleaseLens is responding/);
});

test("does not render a detached user avatar", () => {
  assert.doesNotMatch(userMessage, /message-avatar|<User/);
});
