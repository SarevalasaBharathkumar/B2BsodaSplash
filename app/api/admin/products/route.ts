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
    name?: string;
    description?: string;
    imageUrl?: string;
    displayOrder?: number;
  };

  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json({ error: "Product name is required." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("products")
    .insert({
      name,
      description: body.description?.trim() || null,
      image_url: body.imageUrl?.trim() || null,
      display_order: Number.isFinite(Number(body.displayOrder)) ? Math.max(0, Math.round(Number(body.displayOrder))) : 0,
      is_active: true
    })
    .select("id,name,description,image_url,display_order,is_active")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ product: data });
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
    name?: string;
    description?: string;
    imageUrl?: string;
    displayOrder?: number;
    isActive?: boolean;
  };

  if (!body.id) {
    return NextResponse.json({ error: "Product id is required." }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  if (body.name !== undefined) patch.name = body.name.trim();
  if (body.description !== undefined) patch.description = body.description.trim() || null;
  if (body.imageUrl !== undefined) patch.image_url = body.imageUrl.trim() || null;
  if (body.displayOrder !== undefined) patch.display_order = Math.max(0, Math.round(Number(body.displayOrder) || 0));
  if (typeof body.isActive === "boolean") patch.is_active = body.isActive;

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("products")
    .update(patch)
    .eq("id", body.id)
    .select("id,name,description,image_url,display_order,is_active")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ product: data });
}

export async function DELETE(request: Request) {
  if (!hasSupabaseAdminEnv) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const staff = await requireAdmin(request);
  if (!staff) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const body = (await request.json()) as { id?: string };
  if (!body.id) {
    return NextResponse.json({ error: "Product id is required." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("products").delete().eq("id", body.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
