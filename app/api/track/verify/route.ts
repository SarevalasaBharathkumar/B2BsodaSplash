import { NextResponse } from "next/server";
import { stageLabels } from "@/lib/config";
import { createSupabaseAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase";
import { normalizeEmail } from "@/lib/quotes";

function shouldRetryWithoutInvoiceColumns(error: { message?: string } | null) {
  const message = error?.message || "";
  return (
    message.includes("schema cache") ||
    message.includes("latest_invoice_number") ||
    message.includes("invoice_version") ||
    message.includes("additional_charges") ||
    message.includes("payment_status") ||
    message.includes("does not exist")
  );
}

function withTrackingDefaults(quote: any) {
  if (!quote) return quote;
  return {
    subtotal: quote.total ?? 0,
    discount_amount: 0,
    tax_amount: 0,
    additional_charges: 0,
    payment_status: "pending",
    latest_invoice_number: null,
    invoice_version: 0,
    ...quote
  };
}

export async function POST(request: Request) {
  if (!hasSupabaseAdminEnv) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const { quoteNumber, email, code } = await request.json();
  const normalizedEmail = normalizeEmail(String(email || ""));
  const supabase = createSupabaseAdminClient();

  let { data: quote, error } = await supabase
    .from("quotes")
    .select(`
      id,
      quote_number,
      customer_name,
      email,
      business_name,
      business_type,
      status,
      subtotal,
      discount_amount,
      tax_amount,
      additional_charges,
      total,
      payment_status,
      latest_invoice_number,
      invoice_version,
      created_at,
      quote_items(flavour_name,quantity,price_per_case,line_total),
      quote_status_events(to_status,created_at,note)
    `)
    .eq("quote_number", String(quoteNumber || "").trim())
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (shouldRetryWithoutInvoiceColumns(error)) {
    const fallback = await supabase
      .from("quotes")
      .select(`
        id,
        quote_number,
        customer_name,
        email,
        business_name,
        business_type,
        status,
        total,
        created_at,
        quote_items(flavour_name,quantity,price_per_case,line_total),
        quote_status_events(to_status,created_at,note)
      `)
      .eq("quote_number", String(quoteNumber || "").trim())
      .eq("email", normalizedEmail)
      .maybeSingle();
    quote = withTrackingDefaults(fallback.data);
    error = fallback.error;
  } else {
    quote = withTrackingDefaults(quote);
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!quote) {
    return NextResponse.json({ error: "No matching quote found." }, { status: 404 });
  }

  const { data: otp } = await supabase
    .from("tracking_otps")
    .select("id")
    .eq("quote_id", quote.id)
    .eq("email", normalizedEmail)
    .eq("code", String(code || "").trim())
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!otp) {
    return NextResponse.json({ error: "Invalid or expired verification code." }, { status: 401 });
  }

  await supabase
    .from("tracking_otps")
    .update({ used_at: new Date().toISOString() })
    .eq("id", otp.id);

  return NextResponse.json({
    quote: {
      ...quote,
      statusLabel: stageLabels[quote.status as keyof typeof stageLabels] ?? quote.status
    }
  });
}
