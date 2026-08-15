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
const scope = read("src/components/assistant/project-scope-bar.tsx");
const latestSummaryProxy = read("src/app/api/github/summary/latest/route.ts");
const contextDrawer = read(
  "src/components/assistant/conversation-context-drawer.tsx",
);
const titleHelper = read("src/components/assistant/conversation-title.ts");
const welcome = read("src/components/assistant/welcome-state.tsx");
const assistantMessage = read(
  "src/components/assistant/assistant-message.tsx",
);
const typingIndicator = read(
  "src/components/assistant/assistant-typing-indicator.tsx",
);
const followUps = read("src/components/assistant/assistant-follow-ups.ts");

test("makes conversation the primary two-region layout", () => {
  assert.match(css, /clamp\(230px, 19vw, 280px\) minmax\(0, 1fr\)/);
  assert.match(css, /\.chat-page\.history-collapsed/);
  assert.match(css, /width: min\(100%, 900px\)/);
  assert.match(css, /max-width: 68%/);
  assert.doesNotMatch(workspace, /className="evidence-rail"/);
});

test("defines responsive Evidence and conversation drawers", () => {
  assert.match(css, /@media \(max-width: 1599px\)/);
  assert.match(css, /@media \(max-width: 1099px\)/);
  assert.match(css, /@media \(max-width: 767px\)/);
  assert.match(css, /\.conversations\.open/);
  assert.match(css, /\.main:has\(> \.chat-page\)/);
  assert.match(css, /\.evidence-panel\s*\{[\s\S]*position: absolute/);
  assert.match(css, /\.assistant-drawer-backdrop\s*\{[\s\S]*position: absolute/);
  assert.match(css, /width: min\(420px, 100%\)/);
  assert.match(workspace, /event\.key !== "Escape"/);
});

test("moves repository controls into an on-demand Context drawer", () => {
  assert.match(contextDrawer, /Conversation context/);
  assert.match(contextDrawer, /<ProjectScopeBar/);
  assert.match(workspace, /contextOpen/);
  assert.match(workspace, /<ConversationContextDrawer/);
  assert.doesNotMatch(workspace, /<ProjectScopeBar/);
  assert.match(composer, /onContext/);
  assert.match(css, /\.context-drawer/);
});

test("uses compact prompts, friendly titles, and progressive answer disclosure", () => {
  assert.match(welcome, /Executive summary/);
  assert.match(welcome, /aria-label="Suggested questions"/);
  assert.doesNotMatch(welcome, /ArrowUpRight|detail:/);
  assert.match(titleHelper, /Project Functions/);
  assert.match(titleHelper, /Executive Summary/);
  assert.match(assistantMessage, /Show full answer/);
  assert.match(assistantMessage, /You might also ask/);
  assert.match(css, /\.message\.assistant \.assistant-card[\s\S]*border: 0/);
});

test("keeps Evidence closed by default and removes technical history metadata", () => {
  assert.match(workspace, /useState\(false\).*contextOpen/s);
  assert.doesNotMatch(workspace, /releaselens-evidence-open/);
  assert.doesNotMatch(sidebar, /replaceAll\("_", " "\)/);
  assert.match(evidence, /Sources &amp; Evidence/);
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
  assert.match(proxy, /await response\.text\(\)/);
  assert.match(proxy, /Chat service returned \$\{response\.status\}/);
});

test("preserves project isolation and prevents duplicate sends", () => {
  assert.match(workspace, /requestVersionRef/);
  assert.match(workspace, /version !== requestVersionRef\.current/);
  assert.match(workspace, /sendingRef\.current/);
  assert.match(workspace, /setMessages\(\[\]\)/);
});

test("supports repository branches and generated-summary-only grounding", () => {
  assert.match(scope, /Assistant repository/);
  assert.match(scope, /Assistant repository branch/);
  assert.match(scope, /Use generated summary/);
  assert.match(scope, /generated summary/);
  assert.doesNotMatch(scope, /summary vectors/);
  assert.match(workspace, /getProjectRepositories/);
  assert.match(workspace, /getRepositoryBranches/);
  assert.match(workspace, /repositoriesVersionRef/);
  assert.match(workspace, /branchesVersionRef/);
  assert.match(workspace, /summaryVersionRef/);
  assert.doesNotMatch(workspace, /scopeVersionRef/);
  assert.match(scope, /linked from Data Sources/);
  assert.match(workspace, /setUseSummary\(Boolean\(body\.summary\)\)/);
  assert.match(scope, /active automatically/);
  assert.match(workspace, /grounding_mode: "GITHUB_SUMMARY"/);
  assert.match(workspace, /summary_document_id/);
  assert.match(workspace, /GitHub repository evidence/);
  assert.doesNotMatch(workspace, /Generated summary vector retrieval/);
  assert.match(latestSummaryProxy, /\/github\/summary\/latest/);
  assert.match(latestSummaryProxy, /repository_url/);
  assert.match(latestSummaryProxy, /branch/);
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

test("keeps answers conversational and follow-ups intent-aware", () => {
  assert.match(workspace, /scrollIntoView/);
  assert.match(workspace, /block: "start"/);
  assert.match(assistantMessage, /followUpsFor/);
  assert.match(followUps, /Which dependencies are blocking\?/);
  assert.doesNotMatch(assistantMessage, /<Link2|>Sources<\/button>/);
  assert.match(composer, /Ask a follow-up/);
});
test("owns the viewport without clipping the composer", () => {
  assert.match(css, /\.shell:has\(\.chat-page\)[\s\S]*height: 100dvh/);
  assert.match(css, /body:has\(\.chat-page\)[\s\S]*overflow: hidden/);
  assert.match(css, /\.main:has\(> \.chat-page\)[\s\S]*min-height: 0/);
  assert.match(css, /> \.chat-page[\s\S]*flex: 1 1 0/);
  assert.match(css, /\.chat-page \.messages[\s\S]*overflow-y: auto/);
  assert.match(css, /\.chat-page \.composer[\s\S]*flex: 0 0 auto/);
  assert.doesNotMatch(css, /calc\(100vh - 68px\)/);
});
test("handles non-JSON chat responses without exposing parser errors", () => {
  assert.match(workspace, /async function readApiResponse/);
  assert.match(workspace, /const raw = await response\.text\(\)/);
  assert.match(workspace, /ReleaseLens received an invalid response/);
  assert.doesNotMatch(workspace, /await response\.json\(\)/);
});
test("uses a lightweight aligned typing state and readable conversation type", () => {
  assert.match(workspace, /<AssistantTypingIndicator/);
  assert.doesNotMatch(workspace, /thinking-card|Preparing a grounded answer/);
  assert.match(typingIndicator, /message assistant assistant-typing/);
  assert.match(typingIndicator, /typing-dots/);
  assert.match(typingIndicator, /role="status"/);
  assert.match(composer, /Generating…/);
  assert.doesNotMatch(composer, /Working/);
  assert.match(css, /\.chat-page \.answer-content p,[\s\S]*font-size: 16px/);
  assert.match(css, /@keyframes typingPulse/);
  assert.match(css, /prefers-reduced-motion: reduce[\s\S]*\.typing-dots i/);
});