import { NextResponse } from "next/server";
import { projectManagementFetch } from "@/lib/project-management-api";

type GraphErrorDetail = {
  code?: string;
  message?: string;
};

type GraphErrorBody = {
  detail?: GraphErrorDetail | string;
  code?: string;
  error?: string;
  message?: string;
};

function graphError(body: GraphErrorBody | null, fallback: string) {
  const detail =
    body?.detail && typeof body.detail === "object" ? body.detail : null;
  return {
    code: detail?.code || body?.code || "GRAPH_API_ERROR",
    error:
      detail?.message ||
      (typeof body?.detail === "string" ? body.detail : null) ||
      body?.error ||
      body?.message ||
      fallback,
  };
}

export async function proxyGraphRequest(
  path: "health" | "schema" | "search",
  init: RequestInit = {},
) {
  try {
    const response = await projectManagementFetch(`/graph/${path}`, init);
    const text = await response.text();
    let body: unknown = null;
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = { message: text };
      }
    }

    if (!response.ok) {
      const failure = graphError(
        body as GraphErrorBody | null,
        `Graph API returned ${response.status}.`,
      );
      return NextResponse.json(
        { ...failure, retryable: response.status >= 500 },
        { status: response.status },
      );
    }

    return NextResponse.json(body, { status: response.status });
  } catch (cause) {
    return NextResponse.json(
      {
        code: "GRAPH_API_UNAVAILABLE",
        error:
          cause instanceof Error
            ? cause.message
            : "The Graph API could not be reached.",
        retryable: true,
      },
      { status: 502 },
    );
  }
}
