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

export async function GET(request: NextRequest, context: RouteContext) {
  const { repositoryId } = await context.params;
  if (!repositoryId)
    return NextResponse.json(
      { code: "REPOSITORY_REQUIRED", error: "Select a repository." },
      { status: 400 },
    );
  const actor = await resolveProjectManagementActor();
  if (!actor.ok)
    return NextResponse.json(
      {
        code: actor.code,
        message: actor.message,
        retryable: false,
      },
      { status: 401 },
    );
  try {
    const headers: Record<string, string> = { "X-Actor": actor.actor };
    const requestId =
      request.headers.get("x-request-id") ||
      request.headers.get("x-correlation-id");
    if (actor.accessToken)
      headers.Authorization = `Bearer ${actor.accessToken}`;
    if (requestId) headers["X-Request-ID"] = requestId;
    const response = await projectManagementFetch(
      `/github/project-repositories/${encodeURIComponent(repositoryId)}/branches`,
      {
        headers,
      },
    );
    const body = await readBody(response);
    if (!response.ok)
      return upstreamError(
        response.status,
        body,
        "Repository branches could not be loaded.",
      );
    return NextResponse.json(body, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return backendUnavailable();
  }
}
