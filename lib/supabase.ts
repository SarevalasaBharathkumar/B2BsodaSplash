import { createClient } from "@supabase/supabase-js";

export const hasSupabaseEnv =
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export const hasSupabaseAdminEnv =
  hasSupabaseEnv && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

export function createSupabaseBrowserClient() {
  if (!hasSupabaseEnv) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export function createSupabaseAdminClient() {
  if (!hasSupabaseAdminEnv) {
    throw new Error("Missing Supabase admin environment variables");
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}
