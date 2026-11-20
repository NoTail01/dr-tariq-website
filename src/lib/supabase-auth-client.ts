import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import {
  secureAuthCookieOptions,
  supabaseAuthConfig,
} from "./supabase-auth-config";

/**
 * Request-specific Supabase Auth client for Server Components, Server Actions
 * and Route Handlers. The service-role key is never used or exposed here.
 */
export async function createSupabaseAuthClient() {
  const config = supabaseAuthConfig();
  if (!config) throw new Error("Supabase Auth is not configured.");

  const cookieStore = await cookies();

  return createServerClient(config.url, config.key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, secureAuthCookieOptions(options));
          }
        } catch {
          // Server Components cannot write cookies. The proxy refreshes the
          // session before the request reaches this client.
        }
      },
    },
  });
}
