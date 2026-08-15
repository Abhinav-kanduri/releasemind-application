import { NextResponse } from "next/server";
import { resolveProjectManagementActor } from "@/lib/project-management-actor";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const actor = await resolveProjectManagementActor();
  return NextResponse.json(
    actor.ok
      ? {
          authenticated: true,
          source: actor.source,
          user: { id: actor.actor, email: actor.email || null },
        }
      : { authenticated: false, code: actor.code, message: actor.message },
    {
      headers: {
        "Cache-Control": "private, no-store",
      },
    },
  );
}

export async function DELETE() {
  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.signOut();
    if (error)
      return NextResponse.json(
        { code: "SIGN_OUT_FAILED", message: error.message },
        { status: 502 },
      );
    return NextResponse.json(
      { authenticated: false },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return NextResponse.json(
      {
        code: "AUTH_PROVIDER_UNAVAILABLE",
        message: "Authentication is not configured or unavailable.",
      },
      { status: 503 },
    );
  }
}
