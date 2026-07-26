import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  applyWorkspaceSelectionToParams,
  hasWorkspaceContextParams,
  workspaceSelectionFromParams,
} from "../src/workspace-context/workspace-context-url.ts";

const read = (relativePath) =>
  readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf8");

test("restores canonical and legacy context parameters", () => {
  const canonical = workspaceSelectionFromParams(
    new URLSearchParams(
      "productSpaceId=space-1&projectId=project-1&releaseId=release-1&environmentId=production",
    ),
  );
  assert.deepEqual(canonical, {
    productSpaceId: "space-1",
    projectId: "project-1",
    releaseId: "release-1",
    environmentId: "production",
  });
  assert.equal(
    workspaceSelectionFromParams(
      new URLSearchParams("piReleaseId=legacy-release"),
    ).releaseId,
    "legacy-release",
  );
});

test("writes canonical context without discarding page filters", () => {
  const params = applyWorkspaceSelectionToParams(
    new URLSearchParams(
      "piReleaseId=old&featureId=feature-1&unrelated=preserved",
    ),
    {
      productSpaceId: "space-1",
      projectId: "project-1",
      releaseId: "release-1",
      environmentId: null,
    },
  );
  assert.equal(params.get("piReleaseId"), null);
  assert.equal(params.get("releaseId"), "release-1");
  assert.equal(params.get("featureId"), "feature-1");
  assert.equal(params.get("unrelated"), "preserved");
  assert.equal(hasWorkspaceContextParams(params), true);
});

test("uses one shared provider and removes page-owned workspace selectors", () => {
  const shell = read("src/components/layout/app-shell.tsx");
  const dashboard = read(
    "src/components/data-sources/data-source-dashboard.tsx",
  );
  assert.match(shell, /WorkspaceContextProvider/);
  assert.match(shell, /WorkspaceContextBar/);
  assert.match(dashboard, /useWorkspaceContext/);
  assert.doesNotMatch(dashboard, /setSpaceId|setProjectId|changeSpace|changeProject/);
});

test("strict project APIs never fall back to the first project", () => {
  const localSource = read("src/app/api/data-sources/route.ts");
  const projectManagement = read(
    "src/app/api/project-management/sync/route.ts",
  );
  const chat = read("src/app/api/chat/route.ts");
  for (const source of [localSource, projectManagement, chat]) {
    assert.doesNotMatch(source, /allProjects\[0\]|projects\[0\]/);
  }
  assert.match(localSource, /PROJECT_OUTSIDE_PRODUCT_SPACE/);
  assert.match(projectManagement, /PROJECT_OUTSIDE_PRODUCT_SPACE/);
  assert.match(chat, /Select a Project before using Chat/);
});

test("shared context and source modules use Project Management as authority", () => {
  const contextRoute = read("src/app/api/workspace-context/route.ts");
  const localSource = read("src/app/api/data-sources/route.ts");
  const authority = read(
    "src/workspace-context/project-management-workspace.server.ts",
  );

  assert.match(contextRoute, /loadCanonicalProjectManagementWorkspace/);
  assert.match(localSource, /loadCanonicalProjectManagementWorkspace/);
  assert.match(authority, /projectManagementGet\(\s*"\/workspace"/);
  assert.doesNotMatch(contextRoute, /@\/lib\/db|db\./);
  assert.doesNotMatch(localSource, /@\/lib\/db|db\./);
});
