import { NextResponse } from "next/server";
import { defaultFlavours } from "@/lib/flavours";
import { createSupabaseAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase";

export const revalidate = 60;

export async function GET() {
  if (!hasSupabaseAdminEnv) {
    return NextResponse.json({ flavours: defaultFlavours, source: "fallback" });
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("flavours")
    .select("id,product_id,name,note,price_per_case,display_order,color")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ flavours: data ?? defaultFlavours, source: "supabase" });
}
