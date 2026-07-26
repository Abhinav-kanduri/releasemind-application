import { NextRequest } from "next/server";
import {
  knowledgeRequest,
  knowledgeScope,
} from "@/app/api/knowledge-base/proxy";

export async function GET(request: NextRequest) {
  const scope = knowledgeScope(request);
  if (scope.error) return scope.error;
  return knowledgeRequest(request, `${scope.path}/documents`);
}

export async function POST(request: NextRequest) {
  const scope = knowledgeScope(request);
  if (scope.error) return scope.error;
  const formData = await request.formData();
  return knowledgeRequest(request, `${scope.path}/documents`, {
    method: "POST",
    body: formData,
  });
}
