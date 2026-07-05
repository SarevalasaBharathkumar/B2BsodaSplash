import { NextResponse } from "next/server";
import { createSupabaseAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase";
import { getStaffFromRequest } from "@/lib/staff-auth";
import {
  calculateInvoiceTotals,
  issueInvoiceForQuote,
  type InvoiceLineItem,
  type InvoiceQuote
} from "@/lib/invoices";

type ItemUpdateInput = {
  id?: string;
  flavour_id?: string | null;
  flavour_name?: string;
  quantity: number;
  price_per_case: number;
};

type ParsedOrderItem = {
  id?: string;
  flavour_id?: string | null;
  flavour_name: string;
  quantity: number;
  price_per_case: number;
};

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeNumber(value: unknown, fallback = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? Math.max(0, Math.round(numberValue)) : fallback;
}

function parseItems(items: unknown): ParsedOrderItem[] {
  if (!Array.isArray(items) || !items.length) return [];
  return items
    .map((item) => ({
      id: typeof item?.id === "string" ? item.id : undefined,
      flavour_id: typeof item?.flavour_id === "string" ? item.flavour_id : null,
      flavour_name: normalizeString(item?.flavour_name),
      quantity: normalizeNumber(item?.quantity, 0),
      price_per_case: normalizeNumber(item?.price_per_case, 0)
    }))
    .filter((item) => item.flavour_name && item.quantity > 0);
}

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
    ...quote
  };
}

async function loadQuote(supabase: ReturnType<typeof createSupabaseAdminClient>, quoteNumber: string) {
  let { data, error } = await supabase
    .from("quotes")
    .select(`
      id,
      quote_number,
      customer_name,
      email,
      phone,
      business_name,
      business_type,
      bd_id,
      assigned_to,
      referral_source,
      referral_name,
      note,
      internal_note,
      status,
      subtotal,
      discount_type,
      discount_value,
      discount_amount,
      tax_amount,
      additional_charges,
      total,
      payment_status,
      invoice_version,
      latest_invoice_number,
      finalized_at,
      quote_items(id,flavour_id,flavour_name,quantity,price_per_case,line_total)
    `)
    .eq("quote_number", quoteNumber)
    .maybeSingle();

  if (shouldRetryWithoutInvoiceColumns(error)) {
    const fallback = await supabase
      .from("quotes")
      .select(`
        id,
        quote_number,
        customer_name,
        email,
        phone,
        business_name,
        business_type,
        bd_id,
        assigned_to,
        referral_source,
        referral_name,
        note,
        internal_note,
        status,
        total,
        quote_items(id,flavour_id,flavour_name,quantity,price_per_case,line_total)
      `)
      .eq("quote_number", quoteNumber)
      .maybeSingle();

    data = withOrderDefaults(fallback.data);
    error = fallback.error;
  }

  if (error) {
    throw new Error(error.message);
  }

  return withOrderDefaults(data);
}

function isEditableByStaff(
  quote: { bd_id?: string | null; assigned_to?: string | null },
  staff: { id: string; role: "admin" | "bd" } | null,
  hasValidApiKey: boolean
) {
  if (hasValidApiKey) return true;
  if (!staff) return false;
  if (staff.role === "admin") return true;
  return quote.bd_id === staff.id || quote.assigned_to === staff.id;
}

export async function GET(
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

  const supabase = createSupabaseAdminClient();
  const quote = await loadQuote(supabase, params.quoteNumber);

  if (!quote) {
    return NextResponse.json({ error: "Quote not found." }, { status: 404 });
  }

  if (!isEditableByStaff(quote, staff, hasValidApiKey)) {
    return NextResponse.json({ error: "You do not have access to this order." }, { status: 403 });
  }

  const { data: latestInvoice } = await supabase
    .from("invoices")
    .select("id,invoice_number,version,pdf_url,storage_path,generated_at,emailed_at,is_latest,pricing_snapshot")
    .eq("quote_id", quote.id)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({ quote, latestInvoice });
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

  const supabase = createSupabaseAdminClient();
  const quote = await loadQuote(supabase, params.quoteNumber);

  if (!quote) {
    return NextResponse.json({ error: "Quote not found." }, { status: 404 });
  }

  if (!isEditableByStaff(quote, staff, hasValidApiKey)) {
    return NextResponse.json({ error: "You do not have access to edit this order." }, { status: 403 });
  }

  const body = (await request.json()) as {
    customerName?: string;
    email?: string;
    phone?: string;
    businessName?: string | null;
    businessType?: string;
    referralSource?: string;
    referralName?: string | null;
    note?: string | null;
    internalNote?: string | null;
    paymentStatus?: InvoiceQuote["payment_status"];
    discountType?: InvoiceQuote["discount_type"];
    discountValue?: number;
    taxAmount?: number;
    additionalCharges?: number;
    items?: ItemUpdateInput[];
    regenerateInvoice?: boolean;
  };

  const incomingItems = parseItems(body.items);
  const existingItems: ParsedOrderItem[] = (quote.quote_items ?? []).map((item: any) => ({
    id: item.id,
    flavour_id: item.flavour_id,
    flavour_name: item.flavour_name,
    quantity: item.quantity,
    price_per_case: item.price_per_case
  }));
  const nextItems: ParsedOrderItem[] = incomingItems.length
    ? incomingItems
    : existingItems;

  if (!nextItems.length) {
    return NextResponse.json({ error: "At least one line item is required." }, { status: 400 });
  }

  const updatedQuotePatch = {
    customer_name: normalizeString(body.customerName) || quote.customer_name,
    email: normalizeString(body.email) || quote.email,
    phone: normalizeString(body.phone) || quote.phone,
    business_name: body.businessName === undefined ? quote.business_name : normalizeString(body.businessName) || null,
    business_type: normalizeString(body.businessType) || quote.business_type,
    referral_source: normalizeString(body.referralSource) || quote.referral_source,
    referral_name: body.referralName === undefined ? quote.referral_name : normalizeString(body.referralName) || null,
    note: body.note === undefined ? quote.note : normalizeString(body.note) || null,
    internal_note: body.internalNote === undefined ? quote.internal_note : normalizeString(body.internalNote) || null,
    payment_status: body.paymentStatus || quote.payment_status || "pending",
    discount_type: body.discountType === undefined ? quote.discount_type : body.discountType,
    discount_value: normalizeNumber(body.discountValue, quote.discount_value),
    tax_amount: normalizeNumber(body.taxAmount, quote.tax_amount),
    additional_charges: normalizeNumber(body.additionalCharges, quote.additional_charges),
    updated_at: new Date().toISOString()
  };

  const itemsToPersist = nextItems.map((item) => ({
    id: item.id,
    quote_id: quote.id,
    flavour_id: item.flavour_id,
    flavour_name: item.flavour_name,
    quantity: item.quantity,
    price_per_case: item.price_per_case,
    line_total: item.quantity * item.price_per_case
  }));

  const totals = calculateInvoiceTotals(
    itemsToPersist,
    updatedQuotePatch.discount_type,
    updatedQuotePatch.discount_value,
    updatedQuotePatch.tax_amount,
    updatedQuotePatch.additional_charges
  );

  const { error: quoteUpdateError } = await supabase
    .from("quotes")
    .update({
      ...updatedQuotePatch,
      subtotal: totals.subtotal,
      discount_amount: totals.discountAmount,
      total: totals.total,
      finalized_at: quote.finalized_at || (quote.status === "confirmed" ? new Date().toISOString() : quote.finalized_at)
    })
    .eq("id", quote.id);

  if (quoteUpdateError) {
    return NextResponse.json({ error: quoteUpdateError.message }, { status: 500 });
  }

  const existingIds = new Set((quote.quote_items ?? []).map((item: any) => item.id));
  const incomingIds = new Set(itemsToPersist.filter((item) => item.id).map((item) => item.id as string));

  for (const item of itemsToPersist) {
    if (item.id && existingIds.has(item.id)) {
      const { error } = await supabase
        .from("quote_items")
        .update({
          flavour_id: item.flavour_id,
          flavour_name: item.flavour_name,
          quantity: item.quantity,
          price_per_case: item.price_per_case,
          line_total: item.line_total
        })
        .eq("id", item.id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      continue;
    }

    const { error } = await supabase.from("quote_items").insert({
      quote_id: quote.id,
      flavour_id: item.flavour_id,
      flavour_name: item.flavour_name,
      quantity: item.quantity,
      price_per_case: item.price_per_case,
      line_total: item.line_total
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  for (const item of quote.quote_items ?? []) {
    if (!incomingIds.has(item.id)) {
      const { error } = await supabase.from("quote_items").delete().eq("id", item.id);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }
  }

  const shouldGenerateInvoice =
    (body.regenerateInvoice === true && (quote.status === "confirmed" || Boolean(quote.finalized_at))) ||
    quote.status === "confirmed" ||
    Boolean(quote.finalized_at);

  const refreshedQuote = {
    ...quote,
    ...updatedQuotePatch,
    subtotal: totals.subtotal,
    discount_amount: totals.discountAmount,
    tax_amount: totals.taxAmount,
    additional_charges: totals.additionalCharges,
    total: totals.total,
    payment_status: updatedQuotePatch.payment_status,
    finalized_at: quote.finalized_at || (quote.status === "confirmed" ? new Date().toISOString() : quote.finalized_at)
  } as InvoiceQuote;

  if (shouldGenerateInvoice) {
    try {
      const result = await issueInvoiceForQuote({
        supabase,
        quote: refreshedQuote,
        items: itemsToPersist,
        reason: body.regenerateInvoice ? "edited" : "confirmed"
      });

      return NextResponse.json({
        ok: true,
        invoice: result.invoice,
        emailed: result.emailResult.sent,
        message: result.emailResult.sent ? "Invoice regenerated and emailed." : "Invoice regenerated."
      });
    } catch (error) {
      return NextResponse.json({
        ok: true,
        warning: error instanceof Error ? `Order saved, but invoice generation failed: ${error.message}` : "Order saved, but invoice generation failed.",
        message: "Order saved. Invoice generation needs attention."
      });
    }
  }

  return NextResponse.json({
    ok: true,
    message: "Order details updated. Invoice will be generated once the order is confirmed."
  });
}
