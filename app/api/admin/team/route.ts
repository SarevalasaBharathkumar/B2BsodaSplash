import { NextResponse } from "next/server";
import { createSupabaseAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase";
import { getStaffFromRequest } from "@/lib/staff-auth";

async function requireAdmin(request: Request) {
  const staff = await getStaffFromRequest(request);
  return staff?.role === "admin" ? staff : null;
}

export async function POST(request: Request) {
  if (!hasSupabaseAdminEnv) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const staff = await requireAdmin(request);
  if (!staff) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const body = (await request.json()) as {
    email?: string;
    password?: string;
    fullName?: string;
    role?: "admin" | "bd";
  };

  const email = body.email?.trim().toLowerCase();
  const password = body.password?.trim();
  const fullName = body.fullName?.trim();
  const role = body.role === "admin" ? "admin" : "bd";

  if (!email || !email.includes("@") || !password || password.length < 6 || !fullName) {
    return NextResponse.json({ error: "Full name, valid email, and a 6+ character password are required." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { data: userData, error: userError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName }
  });

  if (userError || !userData.user) {
    return NextResponse.json({ error: userError?.message || "Unable to create user." }, { status: 500 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .upsert({
      id: userData.user.id,
      email,
      full_name: fullName,
      role,
      is_active: true
    })
    .select("id,email,full_name,role,is_active")
    .single();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({ profile });
}

export async function PATCH(request: Request) {
  if (!hasSupabaseAdminEnv) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const staff = await requireAdmin(request);
  if (!staff) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const body = (await request.json()) as {
    id?: string;
    fullName?: string;
    role?: "admin" | "bd";
    isActive?: boolean;
  };

  if (!body.id) {
    return NextResponse.json({ error: "Profile id is required." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const patch: Record<string, unknown> = {};
  if (body.fullName !== undefined) patch.full_name = body.fullName.trim();
  if (body.role === "admin" || body.role === "bd") patch.role = body.role;
  if (typeof body.isActive === "boolean") patch.is_active = body.isActive;

  const { data, error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", body.id)
    .select("id,email,full_name,role,is_active")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile: data });
}
