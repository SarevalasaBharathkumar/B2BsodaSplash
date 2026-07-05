import { NextResponse } from "next/server";
import type { OrderStage } from "@/lib/config";
import { canAdvanceStatus } from "@/lib/quotes";
import { issueInvoiceForQuote, sendOrderStatusEmail } from "@/lib/invoices";
import { createSupabaseAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase";
import { getStaffFromRequest } from "@/lib/staff-auth";

function shouldRetryWithoutInvoiceColumns(error: { message?: string } | null) {
  const message = error?.message || "";
  return (
    message.includes("schema cache") ||
    message.includes("latest_invoice_number") ||
    message.includes("invoice_version") ||
    message.includes("additional_charges") ||
    message.includes("cancelled_at") ||
    message.includes("payment_status") ||
    message.includes("does not exist")
  );
}

function withOrderDefaults(quote: any) {
  if (!quote) return quote;
  return {
    subtotal: quote.total ?? 0,
    discount_type: null,
    discount_value: 0,
    discount_amount: 0,
    tax_amount: 0,
    additional_charges: 0,
    payment_status: "pending",
    invoice_version: 0,
    latest_invoice_number: null,
    finalized_at: null,
    cancelled_at: null,
    ...quote
  };
}

export async function PATCH(
  request: Request,
  { params }: { params: { quoteNumber: string } }
) {
  if (!hasSupabaseAdminEnv) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const staff = await getStaffFromRequest(request);
  const hasValidApiKey =
    Boolean(process.env.ADMIN_API_KEY) &&
    request.headers.get("x-admin-key") === process.env.ADMIN_API_KEY;

  if (!staff && !hasValidApiKey) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { nextStatus, actorRole = "admin", note } = (await request.json()) as {
    nextStatus: OrderStage;
    actorRole?: "admin" | "bd" | "system";
    note?: string;
  };

  const supabase = createSupabaseAdminClient();
  let supportsInvoiceColumns = true;
  let { data: quote, error } = await supabase
    .from("quotes")
    .select("id,quote_number,status,customer_name,email,phone,business_name,business_type,referral_source,referral_name,note,internal_note,subtotal,discount_type,discount_value,discount_amount,tax_amount,additional_charges,total,payment_status,invoice_version,latest_invoice_number,finalized_at,cancelled_at,quote_items(id,flavour_id,flavour_name,quantity,price_per_case,line_total)")
    .eq("quote_number", params.quoteNumber)
    .single();

  if (shouldRetryWithoutInvoiceColumns(error)) {
    supportsInvoiceColumns = false;
    const fallback = await supabase
      .from("quotes")
      .select("id,quote_number,status,customer_name,email,phone,business_name,business_type,referral_source,referral_name,note,internal_note,total,quote_items(id,flavour_id,flavour_name,quantity,price_per_case,line_total)")
      .eq("quote_number", params.quoteNumber)
      .single();
    quote = withOrderDefaults(fallback.data);
    error = fallback.error;
  } else {
    quote = withOrderDefaults(quote);
  }

  if (error || !quote) {
    return NextResponse.json({ error: error?.message || "Quote not found." }, { status: 404 });
  }

  const effectiveRole = staff?.role || actorRole;
  if (effectiveRole === "bd" && !["contacted", "negotiating", "cancelled"].includes(nextStatus)) {
    return NextResponse.json({ error: "BD users can only move orders to contacted, negotiating, or cancelled." }, { status: 403 });
  }

  if (!canAdvanceStatus(quote.status as OrderStage, nextStatus)) {
    return NextResponse.json({ error: "Orders can only move one stage forward." }, { status: 400 });
  }

  const updatePatch: Record<string, unknown> = {
    status: nextStatus,
    updated_at: new Date().toISOString()
  };
  if (supportsInvoiceColumns) {
    updatePatch.finalized_at = nextStatus === "confirmed" ? quote.finalized_at || new Date().toISOString() : quote.finalized_at;
    updatePatch.cancelled_at = nextStatus === "cancelled" ? quote.cancelled_at || new Date().toISOString() : quote.cancelled_at;
  }

  const { error: updateError } = await supabase
    .from("quotes")
    .update(updatePatch)
    .eq("id", quote.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  await supabase.from("quote_status_events").insert({
    quote_id: quote.id,
    from_status: quote.status,
    to_status: nextStatus,
    actor_id: staff?.id || null,
    actor_role: effectiveRole,
    note: note || null
  });

  if (nextStatus === "confirmed") {
    if (!supportsInvoiceColumns) {
      return NextResponse.json({
        ok: true,
        status: nextStatus,
        warning: "Order confirmed, but invoice generation needs the Supabase schema migration to be run first."
      });
    }

    const confirmedQuote = {
      ...quote,
      status: nextStatus,
      finalized_at: quote.finalized_at || new Date().toISOString()
    };
    try {
      await issueInvoiceForQuote({
        supabase,
        quote: confirmedQuote,
        items: (quote.quote_items ?? []).map((item: any) => ({
          flavour_id: item.flavour_id,
          flavour_name: item.flavour_name,
          quantity: item.quantity,
          price_per_case: item.price_per_case,
          line_total: item.line_total
        })),
        reason: "confirmed"
      });
    } catch (error) {
      return NextResponse.json({
        ok: true,
        status: nextStatus,
        warning: error instanceof Error ? `Order confirmed, but invoice generation failed: ${error.message}` : "Order confirmed, but invoice generation failed."
      });
    }
  }

  if (nextStatus === "shipped") {
    try {
      const emailResult = await sendOrderStatusEmail({
        to: quote.email,
        customerName: quote.customer_name,
        quoteNumber: quote.quote_number,
        status: "shipped"
      });

      return NextResponse.json({
        ok: true,
        status: nextStatus,
        emailed: emailResult.sent,
        warning: emailResult.sent ? null : "Order shipped, but shipment email was not sent because Resend is not configured."
      });
    } catch (error) {
      return NextResponse.json({
        ok: true,
        status: nextStatus,
        emailed: false,
        warning: error instanceof Error ? `Order shipped, but shipment email failed: ${error.message}` : "Order shipped, but shipment email failed."
      });
    }
  }

  return NextResponse.json({ ok: true, status: nextStatus });
}
