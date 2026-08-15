import { NextRequest, NextResponse } from "next/server";
import { projectManagementFetch } from "@/lib/project-management-api";
import {
  backendUnavailable,
  readBody,
  upstreamError,
} from "@/app/api/github/repository-proxy";

const documentIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> },
) {
  const { documentId } = await params;
  const format = request.nextUrl.searchParams.get("format");
  if (!documentIdPattern.test(documentId) || !["docx", "pdf"].includes(format || ""))
    return NextResponse.json(
      { code: "INVALID_SUMMARY_EXPORT", error: "A valid summary document and export format are required." },
      { status: 400 },
    );

  try {
    const response = await projectManagementFetch(
      `/github/summary/${encodeURIComponent(documentId)}/export?format=${format}`,
      {
        headers: {
          Accept:
            format === "pdf"
              ? "application/pdf"
              : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        },
      },
    );
    if (!response.ok)
      return upstreamError(
        response.status,
        await readBody(response),
        "The repository summary export could not be generated.",
      );

    return new NextResponse(await response.arrayBuffer(), {
      status: 200,
      headers: {
        "Content-Type": response.headers.get("content-type") || "application/octet-stream",
        "Content-Disposition":
          response.headers.get("content-disposition") ||
          `attachment; filename="repository-summary.${format}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return backendUnavailable();
  }
}