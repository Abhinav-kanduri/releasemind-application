import { NextRequest, NextResponse } from "next/server";
import { projectManagementFetch } from "@/lib/project-management-api";
import {
  backendUnavailable,
  readBody,
  upstreamError,
} from "@/app/api/github/repository-proxy";

export async function GET(request: NextRequest) {
  const productSpaceId = request.nextUrl.searchParams.get("productSpaceId");
  const projectId = request.nextUrl.searchParams.get("projectId");
  if (!productSpaceId || !projectId)
    return NextResponse.json(
      {
        code: "WORKSPACE_SCOPE_REQUIRED",
        error: "Select a Product Space and Project.",
      },
      { status: 400 },
    );
  const query = new URLSearchParams({
    product_space_id: productSpaceId,
    project_id: projectId,
  });
  try {
    const response = await projectManagementFetch(
      `/github/repositories/imported?${query}`,
    );
    const body = await readBody(response);
    if (!response.ok)
      return upstreamError(
        response.status,
        body,
        "Linked GitHub repositories could not be loaded.",
      );
    return NextResponse.json(body);
  } catch {
    return backendUnavailable();
  }
}
