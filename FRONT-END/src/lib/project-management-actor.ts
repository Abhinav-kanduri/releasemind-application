const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const AUTHENTICATION_MESSAGE =
  "Sign in with a user who is a member of the selected Project to continue.";

export type ProjectManagementActorResolution =
  | {
      ok: true;
      actor: string;
      email?: string;
      accessToken?: string;
      source: "supabase" | "development";
    }
  | { ok: false; code: string; message: string };

export function resolveDevelopmentActor(
  configuredActor = process.env.PROJECT_MANAGEMENT_ACTOR_ID,
  environment = process.env.NODE_ENV,
): ProjectManagementActorResolution {
  const actor = configuredActor?.trim();

  if (environment === "production" || !actor)
    return {
      ok: false,
      code: "AUTHENTICATED_ACTOR_REQUIRED",
      message: AUTHENTICATION_MESSAGE,
    };

  if (!UUID_PATTERN.test(actor))
    return {
      ok: false,
      code: "INVALID_AUTHENTICATED_ACTOR",
      message:
        "PROJECT_MANAGEMENT_ACTOR_ID must reference an existing auth.users UUID.",
    };

  return { ok: true, actor, source: "development" };
}

export async function resolveProjectManagementActor(): Promise<ProjectManagementActorResolution> {
  try {
    const { createServerSupabaseClient } =
      await import("@/lib/supabase/server");
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (!error && user) {
      if (!UUID_PATTERN.test(user.id))
        return {
          ok: false,
          code: "INVALID_AUTHENTICATED_ACTOR",
          message: AUTHENTICATION_MESSAGE,
        };

      const {
        data: { session },
      } = await supabase.auth.getSession();
      const accessToken =
        session?.user.id === user.id ? session.access_token : undefined;
      return {
        ok: true,
        actor: user.id,
        email: user.email,
        accessToken,
        source: "supabase",
      };
    }
  } catch {
    // Missing Supabase configuration is handled by the local-only fallback below.
  }

  return resolveDevelopmentActor();
}
