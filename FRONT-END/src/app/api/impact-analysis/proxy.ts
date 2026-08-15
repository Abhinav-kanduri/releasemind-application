import { NextRequest, NextResponse } from "next/server";
import {
  PROJECT_MANAGEMENT_API_URL,
  projectManagementFetch,
} from "@/lib/project-management-api";
import { resolveProjectManagementActor } from "@/lib/project-management-actor";

const allowed: Array<{ method: string; pattern: RegExp }> = [
  { method: "POST", pattern: /^runs$/ },
  { method: "GET", pattern: /^runs\/[^/]+$/ },
  {
    method: "GET",
    pattern: /^runs\/[^/]+\/(requirements|findings|graph|observability)$/,
  },
  { method: "GET", pattern: /^runs\/[^/]+\/comparison$/ },
  { method: "POST", pattern: /^runs\/[^/]+\/reanalyze$/ },
  {
    method: "POST",
    pattern: /^runs\/[^/]+\/findings\/[^/]+\/remediation-prompt$/,
  },
  { method: "GET", pattern: /^findings\/[^/]+$/ },
  { method: "GET", pattern: /^findings\/[^/]+\/evidence$/ },
  { method: "POST", pattern: /^findings\/[^/]+\/generated-changes$/ },
  { method: "GET", pattern: /^history$/ },
  { method: "GET", pattern: /^generated-changes\/[^/]+$/ },
  {
    method: "POST",
    pattern: /^generated-changes\/[^/]+\/(validate|approve|pull-request)$/,
  },
];

function allowedPath(method: string, path: string) {
  return allowed.some(
    (candidate) => candidate.method === method && candidate.pattern.test(path),
  );
}

function privilegedGeneratedChangePath(path: string) {
  return (
    /^findings\/[^/]+\/generated-changes$/.test(path) ||
    /^generated-changes\/[^/]+(?:\/(?:validate|approve|pull-request))?$/.test(
      path,
    )
  );
}

function localAnonymousAnalysisEnabled() {
  if (
    process.env.NODE_ENV === "production" ||
    process.env.ALLOW_LOCAL_ANONYMOUS_IMPACT_ANALYSIS !== "true"
  )
    return false;
  try {
    const host = new URL(PROJECT_MANAGEMENT_API_URL).hostname;
    return host === "127.0.0.1" || host === "localhost" || host === "[::1]";
  } catch {
    return false;
  }
}

function forwardedHeaders(
  request: NextRequest,
  hasBody: boolean,
  actor?: string,
  accessToken?: string,
) {
  const headers: Record<string, string> = {};
  if (actor) headers["X-Actor"] = actor;
  const requestId =
    request.headers.get("x-request-id") ||
    request.headers.get("x-correlation-id");
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  if (requestId) headers["X-Request-ID"] = requestId;
  if (hasBody)
    headers["Content-Type"] =
      request.headers.get("content-type") || "application/json";
  return headers;
}

export async function proxyImpactRequest(
  request: NextRequest,
  segments: string[],
) {
  const path = segments.map(encodeURIComponent).join("/");
  if (!allowedPath(request.method, path))
    return NextResponse.json(
      {
        code: "IMPACT_PROXY_ROUTE_NOT_ALLOWED",
        error: "This Impact Analysis operation is not supported.",
      },
      { status: 405 },
    );

  // Local anonymous analysis may generate a persisted, read-only Copilot prompt.
  // Operations that create or publish repository changes remain authenticated.
  const actorRequired =
    privilegedGeneratedChangePath(path) || !localAnonymousAnalysisEnabled();
  const actor = actorRequired
    ? await resolveProjectManagementActor()
    : undefined;
  if (actor && !actor.ok)
    return NextResponse.json(
      {
        code: actor.code,
        message: actor.message,
        retryable: false,
      },
      { status: 401 },
    );

  const hasBody = !["GET", "HEAD"].includes(request.method);
  const body = hasBody ? await request.text() : undefined;
  try {
    const upstream = await projectManagementFetch(
      `/impact-analysis/${path}${request.nextUrl.search}`,
      {
        method: request.method,
        body: body || undefined,
        headers: forwardedHeaders(
          request,
          Boolean(body),
          actor?.actor,
          actor?.accessToken,
        ),
      },
    );
    const responseBody = await upstream.text();
    const headers = new Headers({
      "Content-Type":
        upstream.headers.get("content-type") || "application/json",
      "Cache-Control": "no-store",
    });
    const requestId =
      upstream.headers.get("x-request-id") ||
      upstream.headers.get("x-correlation-id");
    if (requestId) headers.set("X-Request-ID", requestId);
    return new NextResponse(responseBody || null, {
      status: upstream.status,
      headers,
    });
  } catch {
    return NextResponse.json(
      {
        code: "IMPACT_BACKEND_UNAVAILABLE",
        error: "The Impact Analysis backend could not be reached.",
        retryable: true,
      },
      { status: 502 },
    );
  }
}
