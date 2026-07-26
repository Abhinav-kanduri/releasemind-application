"use client";

import { AlertCircle, ChevronRight, RefreshCw } from "lucide-react";
import { useWorkspaceContext } from "./workspace-context.store";

export function WorkspaceContextBar() {
  const state = useWorkspaceContext();
  const initializing = !state.hydrated || state.status === "INITIALIZING";

  return (
    <section className="workspace-context-bar" aria-label="Workspace context">
      <div className="workspace-context-heading">
        <span>
          <small>WORKSPACE CONTEXT</small>
          <strong>Shared across ReleaseMind</strong>
        </span>
        {state.lastSyncedAt && (
          <time dateTime={state.lastSyncedAt}>
            Synchronized{" "}
            {new Date(state.lastSyncedAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </time>
        )}
      </div>
      <div className="workspace-context-fields">
        <label>
          <span>Product Space *</span>
          <select
            aria-label="Product Space"
            value={state.productSpaceId || ""}
            onChange={(event) =>
              state.selectProductSpace(event.target.value || null)
            }
            disabled={initializing}
          >
            <option value="">Select Product Space</option>
            {state.productSpaces.map((option) => (
              <option value={option.id} key={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </label>
        <ChevronRight aria-hidden="true" />
        <label>
          <span>Project *</span>
          <select
            aria-label="Project"
            value={state.projectId || ""}
            onChange={(event) =>
              state.selectProject(event.target.value || null)
            }
            disabled={initializing || !state.productSpaceId}
          >
            <option value="">Select Project</option>
            {state.projects.map((option) => (
              <option value={option.id} key={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </label>
        <ChevronRight aria-hidden="true" />
        <label>
          <span>Release</span>
          <select
            aria-label="Release"
            value={state.releaseId || ""}
            onChange={(event) =>
              state.selectRelease(event.target.value || null)
            }
            disabled={initializing || !state.projectId}
          >
            <option value="">All Releases</option>
            {state.releases.map((option) => (
              <option value={option.id} key={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </label>
        <ChevronRight aria-hidden="true" />
        <label>
          <span>Environment</span>
          <select
            aria-label="Environment"
            value={state.environmentId || ""}
            onChange={(event) =>
              state.selectEnvironment(event.target.value || null)
            }
            disabled={initializing}
          >
            <option value="">All Environments</option>
            {state.environments.map((option) => (
              <option value={option.id} key={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </label>
        <button
          className="workspace-context-refresh"
          onClick={state.refresh}
          aria-label="Refresh workspace context"
          disabled={state.status === "REFRESHING"}
        >
          <RefreshCw />
        </button>
      </div>
      {state.error && (
        <div className="workspace-context-error" role="alert">
          <AlertCircle />
          <span>{state.error.message}</span>
          {state.error.retryable && (
            <button onClick={state.refresh}>Try again</button>
          )}
          {!state.error.retryable && (
            <button onClick={state.reset}>Clear invalid selection</button>
          )}
        </div>
      )}
    </section>
  );
}
