import { NextRequest, NextResponse } from "next/server";
import { projectManagementFetch } from "@/lib/project-management-api";
import {
  backendUnavailable,
  readBody,
  upstreamError,
} from "@/app/api/github/repository-proxy";

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const input = (await request.json().catch(() => null)) as {
    repositoryUrl?: unknown;
    branch?: unknown;
    forceRefresh?: unknown;
  } | null;
  const repositoryUrl =
    typeof input?.repositoryUrl === "string" ? input.repositoryUrl.trim() : "";
  const branch = typeof input?.branch === "string" ? input.branch.trim() : "";
  if (!repositoryUrl || !branch)
    return NextResponse.json(
      {
        code: "SUMMARY_SCOPE_REQUIRED",
        error: "Select a repository and branch.",
      },
      { status: 400 },
    );

  try {
    const response = await projectManagementFetch("/github/summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        repository_url: repositoryUrl,
        branch,
        force_refresh: input?.forceRefresh === true,
      }),
    });
    const body = await readBody(response);
    if (!response.ok)
      return upstreamError(
        response.status,
        body,
        "The repository summary could not be generated.",
      );
    return NextResponse.json(body, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return backendUnavailable();
  }
}
