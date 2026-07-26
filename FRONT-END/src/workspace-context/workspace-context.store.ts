"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  WorkspaceContextError,
  WorkspaceContextResponse,
  WorkspaceContextStatus,
  WorkspaceOption,
  WorkspaceProject,
  WorkspaceRelease,
  WorkspaceSelection,
} from "./workspace-context.types";

type WorkspaceContextStore = WorkspaceSelection & {
  productSpace: WorkspaceOption | null;
  project: WorkspaceProject | null;
  release: WorkspaceRelease | null;
  environment: WorkspaceOption | null;
  productSpaces: WorkspaceOption[];
  projects: WorkspaceProject[];
  releases: WorkspaceRelease[];
  environments: WorkspaceOption[];
  status: WorkspaceContextStatus;
  error: WorkspaceContextError | null;
  revision: number;
  refreshToken: number;
  lastSyncedAt: string | null;
  hydrated: boolean;
  setHydrated: (hydrated: boolean) => void;
  replaceSelection: (selection: WorkspaceSelection) => void;
  selectProductSpace: (id: string | null) => void;
  selectProject: (id: string | null) => void;
  selectRelease: (id: string | null) => void;
  selectEnvironment: (id: string | null) => void;
  beginLoading: () => void;
  applyResponse: (response: WorkspaceContextResponse) => void;
  applyError: (error: WorkspaceContextError) => void;
  refresh: () => void;
  reset: () => void;
};

const emptySelection: WorkspaceSelection = {
  productSpaceId: null,
  projectId: null,
  releaseId: null,
  environmentId: null,
};

export const useWorkspaceContext = create<WorkspaceContextStore>()(
  persist(
    (set) => ({
      ...emptySelection,
      productSpace: null,
      project: null,
      release: null,
      environment: null,
      productSpaces: [],
      projects: [],
      releases: [],
      environments: [],
      status: "INITIALIZING",
      error: null,
      revision: 0,
      refreshToken: 0,
      lastSyncedAt: null,
      hydrated: false,
      setHydrated: (hydrated) => set({ hydrated }),
      replaceSelection: (selection) =>
        set({
          ...selection,
          productSpace: null,
          project: null,
          release: null,
          environment: null,
          error: null,
          revision: 0,
        }),
      selectProductSpace: (id) =>
        set((state) => ({
          productSpaceId: id,
          projectId: null,
          releaseId: null,
          productSpace:
            state.productSpaces.find((option) => option.id === id) || null,
          project: null,
          release: null,
          projects: [],
          releases: [],
          error: null,
          revision: state.revision + 1,
        })),
      selectProject: (id) =>
        set((state) => ({
          projectId: id,
          releaseId: null,
          project: state.projects.find((option) => option.id === id) || null,
          release: null,
          releases: [],
          error: null,
          revision: state.revision + 1,
        })),
      selectRelease: (id) =>
        set((state) => ({
          releaseId: id,
          release: state.releases.find((option) => option.id === id) || null,
          error: null,
          revision: state.revision + 1,
        })),
      selectEnvironment: (id) =>
        set((state) => ({
          environmentId: id,
          environment:
            state.environments.find((option) => option.id === id) || null,
          error: null,
          revision: state.revision + 1,
        })),
      beginLoading: () =>
        set((state) => ({
          status: state.lastSyncedAt ? "REFRESHING" : "INITIALIZING",
          error: null,
        })),
      applyResponse: (response) =>
        set((state) => ({
          ...response.selection,
          productSpace: response.resolved.productSpace,
          project: response.resolved.project,
          release: response.resolved.release,
          environment: response.resolved.environment,
          productSpaces: response.options.productSpaces,
          projects: response.options.projects,
          releases: response.options.releases,
          environments: response.options.environments,
          status:
            response.selection.productSpaceId && response.selection.projectId
              ? "READY"
              : "INCOMPLETE",
          error: null,
          lastSyncedAt: response.lastSyncedAt,
          revision: state.revision + 1,
        })),
      applyError: (error) => set({ status: "ERROR", error }),
      refresh: () =>
        set((state) => ({ refreshToken: state.refreshToken + 1 })),
      reset: () =>
        set((state) => ({
          ...emptySelection,
          productSpace: null,
          project: null,
          release: null,
          environment: null,
          projects: [],
          releases: [],
          error: null,
          revision: state.revision + 1,
        })),
    }),
    {
      name: "releasemind-workspace-context",
      version: 2,
      skipHydration: true,
      partialize: (state) => ({
        productSpaceId: state.productSpaceId,
        projectId: state.projectId,
        releaseId: state.releaseId,
        environmentId: state.environmentId,
      }),
    },
  ),
);
