const port = process.argv[2];
if (!port) throw new Error("A Chrome remote-debugging port is required.");

const scope =
  "productSpaceId=9cf27354-fd3e-49bd-8144-635ec34e9cd3" +
  "&projectId=abdbbe0d-cadf-456b-ae24-8e7e549036e7";
const routeDefinitions = [
  {
    path: `/dashboard?${scope}`,
    heading: "Good morning, Alex",
    selectors: { ".metric-card": 8, ".health-row": 8 },
  },
  {
    path: `/data-sources?${scope}`,
    heading: "Data sources",
    selectors: { ".workspace-list button": 4 },
  },
  {
    path: `/workspace/data-sources/github?${scope}`,
    heading: "GitHub",
    selectors: { ".source-metric": 3, ".source-state": 1 },
  },
  {
    path: `/workspace/data-sources/project-management?${scope}`,
    heading: "Project Management Tool",
    selectors: { ".source-metric": 3, ".feature-detail": 2 },
  },
  {
    path: `/workspace/data-sources/knowledge-base?${scope}`,
    heading: "Knowledge Base",
    selectors: { ".source-metric": 3, ".knowledge-table tbody tr": 1 },
  },
  {
    path: `/impact-analysis?${scope}`,
    heading: "Impact Analysis",
    selectors: {
      ".impact-metric": 7,
      ".impact-node": 1,
      ".impact-table tbody tr": 1,
    },
  },
  {
    path: `/workspace/data-sources/impact-analysis?${scope}`,
    heading: "Impact Analysis",
    selectors: { ".impact-metric": 7, ".impact-node": 1 },
  },
];
const routeFilter = process.argv[3];
const inspectCurrentPage = process.argv[4] === "current";
const routes = routeFilter
  ? routeDefinitions.filter((route) => route.path.includes(routeFilter))
  : routeDefinitions;

await new Promise((resolve) => setTimeout(resolve, 1500));
const tabs = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
const page = tabs.find((tab) => tab.type === "page");
if (!page) throw new Error("A dashboard browser tab was not found.");

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

const results = [];
for (const route of routes) {
  if (!inspectCurrentPage)
    await send("Page.navigate", { url: `http://127.0.0.1:3000${route.path}` });
  await new Promise((resolve) => setTimeout(resolve, 4500));
  const observed = await evaluate(`(() => ({
    url: location.pathname,
    heading: document.querySelector("main h1")?.textContent?.trim(),
    width: innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
    overflowElements: [...document.querySelectorAll("main *")]
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return (
          rect.width > 0 &&
          rect.height > 0 &&
          style.display !== "none" &&
          rect.right > innerWidth + 1
        );
      })
      .slice(0, 12)
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          tag: element.tagName.toLowerCase(),
          className: String(element.className || ""),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
          scrollWidth: element.scrollWidth
        };
      }),
    errorDialog: Boolean(
      document.querySelector("nextjs-portal")?.shadowRoot?.querySelector(
        "[data-nextjs-dialog]"
      )
    ),
    counts: ${JSON.stringify(Object.keys(route.selectors))}.map(
      (selector) => [selector, document.querySelectorAll(selector).length]
    )
  }))()`);
  const counts = Object.fromEntries(observed.counts);
  const failures = [];
  if (observed.heading !== route.heading)
    failures.push(
      `heading: expected "${route.heading}", got "${observed.heading}"`,
    );
  for (const [selector, minimum] of Object.entries(route.selectors)) {
    if ((counts[selector] || 0) < minimum)
      failures.push(
        `${selector}: expected at least ${minimum}, got ${counts[selector] || 0}`,
      );
  }
  if (observed.horizontalOverflow) failures.push("horizontal page overflow");
  if (observed.errorDialog) failures.push("Next.js runtime error dialog");
  results.push({
    route: route.path.split("?")[0],
    ...observed,
    counts,
    failures,
  });
}

console.log(JSON.stringify(results, null, 2));
socket.close();
if (results.some((result) => result.failures.length)) process.exitCode = 1;
