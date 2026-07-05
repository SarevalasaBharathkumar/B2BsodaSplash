import { NextResponse } from "next/server";
import { createSupabaseAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase";

export const revalidate = 60;

export async function GET() {
  if (!hasSupabaseAdminEnv) {
    return NextResponse.json({ team: [] });
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id,full_name,email")
    .eq("role", "bd")
    .eq("is_active", true)
    .order("full_name", { ascending: true });

  if (error) {
    return NextResponse.json({ team: [] });
  }

  return NextResponse.json({
    team: (data ?? []).map((member) => ({
      id: member.id,
      name: member.full_name || member.email
    }))
  });
}
