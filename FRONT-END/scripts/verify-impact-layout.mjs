const port = process.argv[2];
if (!port) throw new Error("A Chrome remote-debugging port is required.");

await new Promise((resolve) => setTimeout(resolve, 3500));
const tabs = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
const page = tabs.find(
  (tab) => tab.type === "page" && tab.url.includes("impact-analysis"),
);
if (!page) throw new Error("The Impact Analysis tab was not found.");

const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.onopen = resolve;
  socket.onerror = reject;
});
let requestId = 0;
const pending = new Map();
socket.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (!message.id || !pending.has(message.id)) return;
  pending.get(message.id)(message);
  pending.delete(message.id);
};
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = ++requestId;
    pending.set(id, (message) =>
      message.error ? reject(message.error) : resolve(message.result),
    );
    socket.send(JSON.stringify({ id, method, params }));
  });
const evaluate = async (expression) => {
  const response = await send("Runtime.evaluate", {
    expression,
    returnByValue: true,
  });
  return response.result.value;
};

const layout = await evaluate(`(() => {
  const selectors = [
    ".impact-heading",
    ".impact-snapshot",
    ".impact-scope",
    ".impact-summary",
    ".impact-filter-bar",
    ".impact-overview-grid",
    ".impact-work-grid"
  ];
  const rects = selectors.map((selector) => {
    const element = document.querySelector(selector);
    const rect = element?.getBoundingClientRect();
    return element ? {
      selector,
      top: Math.round(rect.top),
      bottom: Math.round(rect.bottom),
      left: Math.round(rect.left),
      right: Math.round(rect.right)
    } : null;
  }).filter(Boolean);
  return {
    title: document.title,
    viewport: [innerWidth, innerHeight],
    documentWidth: document.documentElement.scrollWidth,
    documentHeight: document.documentElement.scrollHeight,
    heading: document.querySelector("h1")?.textContent,
    state: document.querySelector(".impact-state h2")?.textContent,
    url: location.href,
    loading: Boolean(document.querySelector(".impact-loading")),
    stateText: document.querySelector(".impact-state")?.textContent?.trim(),
    context: localStorage.getItem("releasemind-workspace-context"),
    apiResources: performance.getEntriesByType("resource").map((entry) => entry.name).filter((name) => name.includes("/api/")),
    errorOverlay: [...(document.querySelector("nextjs-portal")?.shadowRoot?.querySelectorAll("h1,h2,p,pre") || [])].map((element) => element.textContent?.trim()).filter(Boolean).slice(0, 12),
    metrics: document.querySelectorAll(".impact-metric").length,
    nodes: document.querySelectorAll(".impact-node").length,
    tableRows: document.querySelectorAll(".impact-table tbody tr").length,
    snapshot: document.querySelector(".impact-snapshot strong")?.textContent,
    horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
    verticalOverlap: rects
      .slice(1)
      .filter((rect, index) => rect.top < rects[index].bottom)
      .map((rect) => rect.selector),
    rects
  };
})()`);

await evaluate(`document.querySelector(".record-link")?.click()`);
await new Promise((resolve) => setTimeout(resolve, 250));
const drawer = await evaluate(`(() => {
  const element = document.querySelector(".impact-drawer");
  const rect = element?.getBoundingClientRect();
  return {
    visible: Boolean(element),
    width: Math.round(rect?.width || 0),
    evidenceCards: document.querySelectorAll(".evidence-card").length,
    title: element?.querySelector("h2")?.textContent
  };
})()`);

console.log(JSON.stringify({ layout, drawer }, null, 2));
socket.close();
