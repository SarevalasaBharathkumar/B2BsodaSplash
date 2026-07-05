import { createSupabaseAdminClient } from "./supabase";

export async function getStaffFromRequest(request: Request) {
  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;

  if (!token) return null;

  const supabase = createSupabaseAdminClient();
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id,email,full_name,role,is_active")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (!profile?.is_active) return null;
  return profile;
}
