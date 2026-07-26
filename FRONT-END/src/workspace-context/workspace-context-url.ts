import type { WorkspaceSelection } from "./workspace-context.types";

const keys = [
  "productSpaceId",
  "projectId",
  "releaseId",
  "environmentId",
] as const;

export function hasWorkspaceContextParams(params: URLSearchParams): boolean {
  return keys.some((key) => params.has(key)) || params.has("piReleaseId");
}

export function workspaceSelectionFromParams(
  params: URLSearchParams,
): WorkspaceSelection {
  return {
    productSpaceId: params.get("productSpaceId"),
    projectId: params.get("projectId"),
    releaseId: params.get("releaseId") || params.get("piReleaseId"),
    environmentId: params.get("environmentId"),
  };
}

export function applyWorkspaceSelectionToParams(
  params: URLSearchParams,
  selection: WorkspaceSelection,
): URLSearchParams {
  const next = new URLSearchParams(params);
  next.delete("piReleaseId");
  for (const key of keys) {
    const value = selection[key];
    if (value) next.set(key, value);
    else next.delete(key);
  }
  return next;
}
