import { NextRequest, NextResponse } from "next/server";
import { projectManagementFetch } from "@/lib/project-management-api";
import { resolveProjectManagementActor } from "@/lib/project-management-actor";
import {
  backendUnavailable,
  readBody,
  upstreamError,
} from "@/app/api/github/repository-proxy";

type RouteContext = {
  params: Promise<{ repositoryId: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const { repositoryId } = await context.params;
  const input = (await request.json().catch(() => null)) as {
    branch?: unknown;
    forceRefresh?: unknown;
  } | null;
  const branch = typeof input?.branch === "string" ? input.branch.trim() : "";
  if (!repositoryId || !branch)
    return NextResponse.json(
      { code: "BRANCH_REQUIRED", error: "Select a repository branch." },
      { status: 400 },
    );
  const actor = await resolveProjectManagementActor();
  if (!actor.ok)
    return NextResponse.json(
      { code: actor.code, error: actor.message, retryable: false },
      { status: 401 },
    );
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    headers["X-Actor"] = actor.actor;
    const requestId =
      request.headers.get("x-request-id") ||
      request.headers.get("x-correlation-id");
    if (actor.accessToken)
      headers.Authorization = `Bearer ${actor.accessToken}`;
    if (requestId) headers["X-Request-ID"] = requestId;
    const response = await projectManagementFetch(
      `/github/project-repositories/${encodeURIComponent(repositoryId)}/sync`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          branch,
          force_refresh: input?.forceRefresh === true,
        }),
      },
    );
    const body = await readBody(response);
    if (!response.ok)
      return upstreamError(
        response.status,
        body,
        "The selected repository branch could not be synchronized.",
      );
    return NextResponse.json(body, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return backendUnavailable();
  }
}
