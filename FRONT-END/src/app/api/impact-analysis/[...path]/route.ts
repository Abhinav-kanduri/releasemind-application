import { NextRequest } from "next/server";
import { proxyImpactRequest } from "@/app/api/impact-analysis/proxy";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

async function proxy(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyImpactRequest(request, path);
}

export const GET = proxy;
export const POST = proxy;
