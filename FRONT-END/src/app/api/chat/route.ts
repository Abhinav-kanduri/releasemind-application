import { NextRequest, NextResponse } from "next/server";
import { PROJECT_MANAGEMENT_API_V1 } from "@/lib/project-management-api";
import { sanitizeAssistantAnswer } from "@/components/assistant/assistant-sanitizer";

const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
async function backend(path: string, init?: RequestInit) {
  const response = await fetch(`${PROJECT_MANAGEMENT_API_V1}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Actor": "local-user",
      ...(init?.headers || {}),
    },
  });
  const body = await response.json();
  if (!response.ok)
    throw Object.assign(
      new Error(
        body.detail?.message ||
          body.detail ||
          body.message ||
          "Chat request failed.",
      ),
      { status: response.status, body },
    );
  return body;
}
async function context(productSpaceId?: string, projectId?: string) {
  const workspace = await backend("/workspace");
  const spaces = workspace.product_spaces || [];
  const projects = spaces.flatMap(
    (space: { id: string; projects: unknown[] }) =>
      (space.projects || []).map((project) => ({
        ...(project as object),
        product_space_id: space.id,
      })),
  ) as Array<{ id: string; name: string; product_space_id: string }>;
  const project =
    projects.find((item) => item.id === projectId) ||
    projects.find((item) => item.product_space_id === productSpaceId) ||
    projects[0];
  if (!project) throw new Error("No active Project is available for Chat.");
  return {
    project_id: project.id,
    product_space_id: project.product_space_id,
    project_name: project.name,
  };
}

function normalizeChatResponse(body: Record<string, unknown>) {
  if (typeof body.answer === "string") {
    body.answer = sanitizeAssistantAnswer(body.answer);
  }
  if (Array.isArray(body.items)) {
    body.items = body.items.map((item) => {
      if (!item || typeof item !== "object") return item;
      const message = item as Record<string, unknown>;
      if (message.role === "ASSISTANT" && typeof message.content === "string") {
        message.content = sanitizeAssistantAnswer(message.content);
      }
      const metadata = message.metadata;
      if (metadata && typeof metadata === "object") {
        const response = (metadata as Record<string, unknown>).response;
        if (response && typeof response === "object") {
          const stored = response as Record<string, unknown>;
          if (typeof stored.answer === "string") {
            stored.answer = sanitizeAssistantAnswer(stored.answer);
          }
        }
      }
      return message;
    });
  }
  return body;
}

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get("sessionId");
    if (sessionId && uuid.test(sessionId)) {
      return NextResponse.json(
        normalizeChatResponse(
          await backend(`/chat/conversations/${sessionId}/messages?limit=200`),
        ),
      );
    }
    const selected = await context(
      request.nextUrl.searchParams.get("productSpaceId") || undefined,
      request.nextUrl.searchParams.get("projectId") || undefined,
    );
    const conversations = await backend(
      `/chat/conversations?projectId=${selected.project_id}&status=ACTIVE&limit=50`,
    );
    return NextResponse.json({ ...conversations, context: selected });
  } catch (error) {
    const failure = error as Error & { status?: number; body?: unknown };
    return NextResponse.json(
      { error: failure.message, details: failure.body },
      { status: failure.status || 502 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const input = await request.json();
    const selected = input.session_id
      ? null
      : await context(
          uuid.test(input.product_space_id || "")
            ? input.product_space_id
            : undefined,
          uuid.test(input.project_id || "") ? input.project_id : undefined,
        );
    const payload = {
      session_id: input.session_id || null,
      product_space_id: selected?.product_space_id || null,
      project_id: selected?.project_id || null,
      message: input.message,
      client_message_id: input.client_message_id || crypto.randomUUID(),
      context: input.context || {},
      response_mode: "NORMAL",
    };
    return NextResponse.json(
      normalizeChatResponse(
        await backend("/chat", {
          method: "POST",
          body: JSON.stringify(payload),
        }),
      ),
    );
  } catch (error) {
    const failure = error as Error & { status?: number; body?: unknown };
    return NextResponse.json(
      { error: failure.message, details: failure.body },
      { status: failure.status || 502 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get("sessionId");
    if (!sessionId || !uuid.test(sessionId))
      return NextResponse.json(
        { error: "Invalid conversation." },
        { status: 422 },
      );
    return NextResponse.json(
      await backend(`/chat/conversations/${sessionId}`, { method: "DELETE" }),
    );
  } catch (error) {
    const failure = error as Error & { status?: number; body?: unknown };
    return NextResponse.json(
      { error: failure.message, details: failure.body },
      { status: failure.status || 502 },
    );
  }
}
