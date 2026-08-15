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
  if (!repositoryUrl)
    return NextResponse.json(
      { code: "REPOSITORY_URL_REQUIRED", error: "Select a repository." },
      { status: 400 },
    );

  const query = new URLSearchParams({ repository_url: repositoryUrl });
  try {
    const response = await projectManagementFetch(
      `/github/repositories/branches?${query}`,
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
