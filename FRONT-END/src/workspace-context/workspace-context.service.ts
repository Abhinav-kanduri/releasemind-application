import type {
  WorkspaceContextError,
  WorkspaceContextResponse,
  WorkspaceSelection,
} from "./workspace-context.types";

export class WorkspaceContextRequestError extends Error {
  code: WorkspaceContextError["code"];
  retryable: boolean;
  status: number;

  constructor(
    message: string,
    status: number,
    code: WorkspaceContextError["code"] = "CONTEXT_UNAVAILABLE",
    retryable = status >= 500,
  ) {
    super(message);
    this.name = "WorkspaceContextRequestError";
    this.status = status;
    this.code = code;
    this.retryable = retryable;
  }
}

export async function loadWorkspaceContext(
  selection: WorkspaceSelection,
  signal?: AbortSignal,
): Promise<WorkspaceContextResponse> {
  const params = new URLSearchParams();
  if (selection.productSpaceId)
    params.set("productSpaceId", selection.productSpaceId);
  if (selection.projectId) params.set("projectId", selection.projectId);
  if (selection.releaseId) params.set("releaseId", selection.releaseId);
  if (selection.environmentId)
    params.set("environmentId", selection.environmentId);

  const response = await fetch(`/api/workspace-context?${params}`, {
    cache: "no-store",
    signal,
  });
  const body = await response.json();
  if (!response.ok) {
    throw new WorkspaceContextRequestError(
      body.error || "Workspace context could not be loaded.",
      response.status,
      body.code,
      body.retryable,
    );
  }
  return body as WorkspaceContextResponse;
}
