import { NextResponse } from "next/server";

type ApiErrorBody = {
  detail?: string | { code?: string; message?: string };
  error?: string | { code?: string; message?: string };
  message?: string;
};

export async function readBody(response: Response) {
  return response.json().catch(() => null) as Promise<unknown>;
}

export function upstreamError(status: number, body: unknown, fallback: string) {
  const candidate = body as ApiErrorBody | null;
  const nested =
    candidate?.error && typeof candidate.error === "object"
      ? candidate.error
      : null;
  const detail =
    candidate?.detail && typeof candidate.detail === "object"
      ? candidate.detail
      : null;
  const message =
    (typeof candidate?.error === "string" ? candidate.error : null) ||
    nested?.message ||
    detail?.message ||
    (typeof candidate?.detail === "string" ? candidate.detail : null) ||
    candidate?.message ||
    fallback;
  return NextResponse.json(
    {
      code:
        nested?.code || detail?.code || "GITHUB_BACKEND_UNAVAILABLE",
      error: message,
    },
    { status },
  );
}

export function backendUnavailable() {
  return upstreamError(
    502,
    null,
    "The ReleaseLens backend could not be reached.",
  );
}
