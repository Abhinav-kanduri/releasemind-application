import { NextRequest, NextResponse } from "next/server";
import { proxyImpactRequest } from "@/app/api/impact-analysis/proxy";

export function GET() {
  return NextResponse.json(
    {
      code: "LEGACY_IMPACT_ROUTE_RETIRED",
      error:
        "Use persisted Impact Analysis runs through /api/impact-analysis/runs.",
    },
    { status: 410 },
  );
}

export function POST(request: NextRequest) {
  return proxyImpactRequest(request, ["runs"]);
}
