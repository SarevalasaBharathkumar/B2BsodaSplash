import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createSupabaseAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase";
import { getStaffFromRequest } from "@/lib/staff-auth";

async function requireAdmin(request: Request) {
  const staff = await getStaffFromRequest(request);
  return staff?.role === "admin" ? staff : null;
}

function normalizeNumber(value: unknown, fallback = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? Math.max(0, Math.round(numberValue)) : fallback;
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
    productId?: string;
    name?: string;
    note?: string;
    pricePerCase?: number;
    color?: string;
    displayOrder?: number;
  };

  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json({ error: "Flavour name is required." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  let productId = body.productId;

  if (!productId) {
    const { data: product } = await supabase
      .from("products")
      .select("id")
      .eq("is_active", true)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    productId = product?.id;
  }

  const { data, error } = await supabase
    .from("flavours")
    .insert({
      product_id: productId || null,
      name,
      note: body.note?.trim() || null,
      price_per_case: normalizeNumber(body.pricePerCase),
      color: body.color?.trim() || "#2e6fb8",
      display_order: normalizeNumber(body.displayOrder),
      is_active: true
    })
    .select("id,product_id,name,note,price_per_case,color,display_order,is_active")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidateTag("public-catalog");

  return NextResponse.json({ flavour: data });
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
    productId?: string;
    name?: string;
    note?: string;
    pricePerCase?: number;
    color?: string;
    displayOrder?: number;
    isActive?: boolean;
  };

  if (!body.id) {
    return NextResponse.json({ error: "Flavour id is required." }, { status: 400 });
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.productId !== undefined) patch.product_id = body.productId || null;
  if (body.name !== undefined) patch.name = body.name.trim();
  if (body.note !== undefined) patch.note = body.note.trim() || null;
  if (body.pricePerCase !== undefined) patch.price_per_case = normalizeNumber(body.pricePerCase);
  if (body.color !== undefined) patch.color = body.color.trim() || "#2e6fb8";
  if (body.displayOrder !== undefined) patch.display_order = normalizeNumber(body.displayOrder);
  if (typeof body.isActive === "boolean") patch.is_active = body.isActive;

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("flavours")
    .update(patch)
    .eq("id", body.id)
    .select("id,product_id,name,note,price_per_case,color,display_order,is_active")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidateTag("public-catalog");

  return NextResponse.json({ flavour: data });
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
    return NextResponse.json({ error: "Flavour id is required." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("flavours").delete().eq("id", body.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidateTag("public-catalog");

  return NextResponse.json({ ok: true });
}
