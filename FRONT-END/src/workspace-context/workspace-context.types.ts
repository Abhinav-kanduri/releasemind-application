export type WorkspaceContextStatus =
  | "INITIALIZING"
  | "READY"
  | "INCOMPLETE"
  | "REFRESHING"
  | "ERROR";

export type WorkspaceSelection = {
  productSpaceId: string | null;
  projectId: string | null;
  releaseId: string | null;
  environmentId: string | null;
};

export type WorkspaceOption = {
  id: string;
  name: string;
};

export type WorkspaceProject = WorkspaceOption & {
  productSpaceId: string;
  key?: string;
};

export type WorkspaceRelease = WorkspaceOption & {
  projectId: string;
};

export type WorkspaceContextError = {
  code:
    | "CONTEXT_UNAVAILABLE"
    | "PRODUCT_SPACE_NOT_FOUND"
    | "PROJECT_NOT_FOUND"
    | "PROJECT_OUTSIDE_PRODUCT_SPACE"
    | "RELEASE_NOT_FOUND"
    | "RELEASE_OUTSIDE_PROJECT"
    | "ENVIRONMENT_UNAVAILABLE";
  message: string;
  retryable: boolean;
};

export type WorkspaceContextResponse = {
  selection: WorkspaceSelection;
  resolved: {
    productSpace: WorkspaceOption | null;
    project: WorkspaceProject | null;
    release: WorkspaceRelease | null;
    environment: WorkspaceOption | null;
  };
  options: {
    productSpaces: WorkspaceOption[];
    projects: WorkspaceProject[];
    releases: WorkspaceRelease[];
    environments: WorkspaceOption[];
  };
  lastSyncedAt: string;
};
