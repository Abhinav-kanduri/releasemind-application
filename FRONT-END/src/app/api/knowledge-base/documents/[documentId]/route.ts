import { NextRequest } from "next/server";
import {
  knowledgeRequest,
  knowledgeScope,
} from "@/app/api/knowledge-base/proxy";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> },
) {
  const scope = knowledgeScope(request);
  if (scope.error) return scope.error;
  const { documentId } = await params;
  return knowledgeRequest(
    request,
    `${scope.path}/documents/${encodeURIComponent(documentId)}`,
    { method: "DELETE" },
  );
}
