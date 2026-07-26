import { NextRequest } from "next/server";
import {
  knowledgeRequest,
  knowledgeScope,
} from "@/app/api/knowledge-base/proxy";

export async function GET(request: NextRequest) {
  const scope = knowledgeScope(request);
  if (scope.error) return scope.error;
  return knowledgeRequest(request, `${scope.path}/stats`);
}
