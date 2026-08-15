import { NextRequest, NextResponse } from "next/server";
import { projectManagementFetch } from "@/lib/project-management-api";
import {
  backendUnavailable,
  readBody,
  upstreamError,
} from "@/app/api/github/repository-proxy";

export async function GET(request: NextRequest) {
  const repositoryUrl = request.nextUrl.searchParams
    .get("repositoryUrl")
    ?.trim();
  const branch = request.nextUrl.searchParams.get("branch")?.trim();
  if (!repositoryUrl || !branch)
    return NextResponse.json(
      {
        code: "SUMMARY_SCOPE_REQUIRED",
        error: "Select a repository and branch.",
      },
      { status: 400 },
    );
  const query = new URLSearchParams({
    repository_url: repositoryUrl,
    branch,
  });
  try {
    const response = await projectManagementFetch(
      `/github/summary/latest?${query}`,
    );
    const body = await readBody(response);
    if (!response.ok)
      return upstreamError(
        response.status,
        body,
        "Generated summary status could not be loaded.",
      );
    return NextResponse.json(body, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return backendUnavailable();
  }
}
