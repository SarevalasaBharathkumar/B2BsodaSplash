import { NextResponse } from "next/server";
import { getStaffFromRequest } from "@/lib/staff-auth";
import { createSupabaseAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase";

function shouldRetryWithoutInvoiceColumns(error: { message?: string } | null) {
  const message = error?.message || "";
  return (
    message.includes("schema cache") ||
    message.includes("latest_invoice_number") ||
    message.includes("invoice_version") ||
    message.includes("does not exist")
  );
}

function shouldRetryWithoutProductCatalogColumns(error: { message?: string } | null) {
  const message = error?.message || "";
  return message.includes("products.display_order");
}

export async function GET(request: Request) {
  if (!hasSupabaseAdminEnv) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const profile = await getStaffFromRequest(request);
  if (!profile) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from("quotes")
    .select("id,quote_number,customer_name,business_name,business_type,status,total,latest_invoice_number,invoice_version,created_at,bd_id,assigned_to")
    .order("created_at", { ascending: false })
    .limit(50);

  const adminDataPromise = profile.role === "admin"
    ? Promise.all([
        supabase.from("profiles").select("id,email,full_name,role,is_active,created_at").order("created_at", { ascending: false }),
        supabase.from("products").select("id,name,description,image_url,display_order,is_active,created_at").order("display_order", { ascending: true }).order("created_at", { ascending: false }),
        supabase.from("flavours").select("id,product_id,name,note,price_per_case,color,display_order,is_active").order("display_order", { ascending: true })
      ])
    : Promise.resolve(null);

  if (profile.role === "bd") {
    query = query.or(`bd_id.eq.${profile.id},assigned_to.eq.${profile.id}`);
  }

  let { data, error } = await query;
  if (shouldRetryWithoutInvoiceColumns(error)) {
    let fallbackQuery = supabase
      .from("quotes")
      .select("id,quote_number,customer_name,business_name,business_type,status,total,created_at,bd_id,assigned_to")
      .order("created_at", { ascending: false })
      .limit(50);

    if (profile.role === "bd") {
      fallbackQuery = fallbackQuery.or(`bd_id.eq.${profile.id},assigned_to.eq.${profile.id}`);
    }

    const fallback = await fallbackQuery;
    data = fallback.data?.map((quote) => ({
      ...quote,
      latest_invoice_number: null,
      invoice_version: 0
    })) ?? null;
    error = fallback.error;
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const quotes = data ?? [];
  const response: Record<string, unknown> = {
    profile,
    quotes,
    metrics: {
      total: quotes.length,
      open: quotes.filter((quote) => !["delivered", "cancelled"].includes(quote.status)).length,
      delivered: quotes.filter((quote) => quote.status === "delivered").length,
      revenue: quotes.filter((quote) => quote.status === "delivered").reduce((sum, quote) => sum + quote.total, 0)
    }
  };

  if (profile.role === "admin") {
    const [teamResult, productsResult, flavoursResult] = (await adminDataPromise) as [
      { data: Array<{ id: string; email: string; full_name: string | null; role: string; is_active: boolean; created_at: string }>; error: any },
      { data: Array<{ id: string; name: string; description: string | null; image_url: string | null; display_order: number; is_active: boolean; created_at: string }>; error: any },
      { data: Array<{ id: string; product_id: string | null; name: string; note: string | null; price_per_case: number; color: string; display_order: number; is_active: boolean }>; error: any }
    ];

    let productsData = productsResult.data ?? [];
    if (shouldRetryWithoutProductCatalogColumns(productsResult.error)) {
      const fallbackProducts = await supabase
        .from("products")
        .select("id,name,description,image_url,is_active,created_at")
        .order("created_at", { ascending: false });

      productsData = fallbackProducts.data?.map((product, index) => ({
          ...product,
          display_order: index + 1
      })) ?? [];
    }

    response.team = teamResult.data ?? [];
    response.products = productsData;
    response.flavours = flavoursResult.data ?? [];
  }

  return NextResponse.json(response);
}
