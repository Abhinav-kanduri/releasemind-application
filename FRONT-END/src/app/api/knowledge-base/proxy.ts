import { NextRequest, NextResponse } from "next/server";
import { projectManagementFetch } from "@/lib/project-management-api";

export function knowledgeScope(request: NextRequest) {
  const productSpaceId = request.nextUrl.searchParams.get("productSpaceId");
  const projectId = request.nextUrl.searchParams.get("projectId");
  if (!productSpaceId || !projectId) {
    return {
      error: NextResponse.json(
        {
          code: "WORKSPACE_CONTEXT_REQUIRED",
          error: "Select a Product Space and Project.",
        },
        { status: 409 },
      ),
    };
  }
  return {
    productSpaceId,
    projectId,
    path:
      `/product-spaces/${encodeURIComponent(productSpaceId)}` +
      `/projects/${encodeURIComponent(projectId)}/knowledge-base`,
  };
}

export async function proxyKnowledgeResponse(response: Response) {
  const body = await response.text();
  return new NextResponse(body || null, {
    status: response.status,
    headers: {
      "Content-Type":
        response.headers.get("content-type") || "application/json",
    },
  });
}

export async function knowledgeRequest(
  request: NextRequest,
  path: string,
  init: RequestInit = {},
) {
  const actor = request.headers.get("x-actor") || "local-user";
  const response = await projectManagementFetch(path, {
    ...init,
    headers: {
      "X-Actor": actor,
      ...init.headers,
    },
  });
  return proxyKnowledgeResponse(response);
}
