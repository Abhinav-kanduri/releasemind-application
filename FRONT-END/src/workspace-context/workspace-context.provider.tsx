"use client";

import { useEffect, useRef } from "react";
import {
  applyWorkspaceSelectionToParams,
  hasWorkspaceContextParams,
  workspaceSelectionFromParams,
} from "./workspace-context-url";
import {
  loadWorkspaceContext,
  WorkspaceContextRequestError,
} from "./workspace-context.service";
import { useWorkspaceContext } from "./workspace-context.store";

export function WorkspaceContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const hydrated = useWorkspaceContext((state) => state.hydrated);
  const productSpaceId = useWorkspaceContext(
    (state) => state.productSpaceId,
  );
  const projectId = useWorkspaceContext((state) => state.projectId);
  const releaseId = useWorkspaceContext((state) => state.releaseId);
  const environmentId = useWorkspaceContext((state) => state.environmentId);
  const refreshToken = useWorkspaceContext((state) => state.refreshToken);
  const requestVersion = useRef(0);

  useEffect(() => {
    let active = true;
    void Promise.resolve(useWorkspaceContext.persist.rehydrate()).then(() => {
      if (!active) return;
      const params = new URLSearchParams(window.location.search);
      if (hasWorkspaceContextParams(params)) {
        useWorkspaceContext
          .getState()
          .replaceSelection(workspaceSelectionFromParams(params));
      }
      useWorkspaceContext.getState().setHydrated(true);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const version = ++requestVersion.current;
    const controller = new AbortController();
    const selection = {
      productSpaceId,
      projectId,
      releaseId,
      environmentId,
    };
    useWorkspaceContext.getState().beginLoading();
    void loadWorkspaceContext(selection, controller.signal)
      .then((response) => {
        if (version !== requestVersion.current) return;
        useWorkspaceContext.getState().applyResponse(response);
        const url = new URL(window.location.href);
        url.search = applyWorkspaceSelectionToParams(
          url.searchParams,
          response.selection,
        ).toString();
        window.history.replaceState(window.history.state, "", url);
      })
      .catch((reason) => {
        if (controller.signal.aborted || version !== requestVersion.current)
          return;
        const error =
          reason instanceof WorkspaceContextRequestError
            ? {
                code: reason.code,
                message: reason.message,
                retryable: reason.retryable,
              }
            : {
                code: "CONTEXT_UNAVAILABLE" as const,
                message: "Workspace context could not be loaded.",
                retryable: true,
              };
        useWorkspaceContext.getState().applyError(error);
      });
    return () => controller.abort();
  }, [
    hydrated,
    productSpaceId,
    projectId,
    releaseId,
    environmentId,
    refreshToken,
  ]);

  useEffect(() => {
    const restore = () => {
      const params = new URLSearchParams(window.location.search);
      useWorkspaceContext
        .getState()
        .replaceSelection(workspaceSelectionFromParams(params));
    };
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, []);

  return children;
}
