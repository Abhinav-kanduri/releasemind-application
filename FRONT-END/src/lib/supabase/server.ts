import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function requiredSupabaseEnvironment() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey =
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey)
    throw new Error(
      "SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY must be configured.",
    );

  return { url, publishableKey };
}

export async function createServerSupabaseClient() {
  const { url, publishableKey } = requiredSupabaseEnvironment();
  const cookieStore = await cookies();

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Components cannot write cookies. Route Handlers and Server
          // Actions can, and are the only callers that refresh or create sessions.
        }
      },
    },
  });
}
