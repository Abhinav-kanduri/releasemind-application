import { NextRequest, NextResponse } from "next/server";
import { projectManagementFetch } from "@/lib/project-management-api";
import {
  backendUnavailable,
  readBody,
  upstreamError,
} from "@/app/api/github/repository-proxy";

export async function POST(request: NextRequest) {
  const input = (await request.json().catch(() => null)) as {
    githubRepositoryId?: unknown;
    productSpaceId?: unknown;
    projectId?: unknown;
  } | null;
  const githubRepositoryId = Number(input?.githubRepositoryId);
  const productSpaceId =
    typeof input?.productSpaceId === "string" ? input.productSpaceId : "";
  const projectId = typeof input?.projectId === "string" ? input.projectId : "";
  if (!Number.isSafeInteger(githubRepositoryId) || githubRepositoryId <= 0)
    return NextResponse.json(
      {
        code: "GITHUB_REPOSITORY_REQUIRED",
        error: "Select a GitHub repository.",
      },
      { status: 400 },
    );
  if (!productSpaceId || !projectId)
    return NextResponse.json(
      {
        code: "WORKSPACE_SCOPE_REQUIRED",
        error: "Select a Product Space and Project.",
      },
      { status: 400 },
    );
  try {
    const response = await projectManagementFetch(
      "/github/repositories/import",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          github_repository_id: githubRepositoryId,
          product_space_id: productSpaceId,
          project_id: projectId,
        }),
      },
    );
    const body = await readBody(response);
    if (!response.ok)
      return upstreamError(
        response.status,
        body,
        "The selected repository could not be linked.",
      );
    return NextResponse.json(body, { status: response.status });
  } catch {
    return backendUnavailable();
  }
}
