import { NextRequest, NextResponse } from "next/server";
import { proxyGraphRequest } from "../graph-proxy";

type SearchBody = {
  query?: unknown;
  k?: unknown;
};

export async function POST(request: NextRequest) {
  let body: SearchBody;
  try {
    body = (await request.json()) as SearchBody;
  } catch {
    return NextResponse.json(
      { code: "INVALID_JSON", error: "Provide a valid JSON request body." },
      { status: 400 },
    );
  }

  const query = typeof body.query === "string" ? body.query.trim() : "";
  const k = body.k === undefined ? 5 : Number(body.k);
  if (!query || query.length > 4000) {
    return NextResponse.json(
      {
        code: "INVALID_GRAPH_QUERY",
        error: "Query must contain between 1 and 4000 characters.",
      },
      { status: 422 },
    );
  }
  if (!Number.isInteger(k) || k < 1 || k > 20) {
    return NextResponse.json(
      {
        code: "INVALID_RESULT_LIMIT",
        error: "Result limit must be an integer between 1 and 20.",
      },
      { status: 422 },
    );
  }

  return proxyGraphRequest("search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, k }),
  });
}
