import { NextRequest, NextResponse } from "next/server";
import { projectManagementFetch } from "@/lib/project-management-api";
import {
  backendUnavailable,
  readBody,
  upstreamError,
} from "@/app/api/github/repository-proxy";

export async function GET(request: NextRequest) {
  const projectId = request.nextUrl.searchParams.get("projectId");
  if (!projectId)
    return NextResponse.json(
      { code: "PROJECT_REQUIRED", error: "Select a Project." },
      { status: 400 },
    );
  const page = request.nextUrl.searchParams.get("page") || "1";
  const perPage = request.nextUrl.searchParams.get("perPage") || "100";
  const query = new URLSearchParams({
    page,
    per_page: perPage,
    project_id: projectId,
  });
  try {
    const response = await projectManagementFetch(
      `/github/repositories?${query}`,
    );
    const body = await readBody(response);
    if (!response.ok)
      return upstreamError(
        response.status,
        body,
        "GitHub repositories could not be loaded.",
      );
    return NextResponse.json(body);
  } catch {
    return backendUnavailable();
  }
}
