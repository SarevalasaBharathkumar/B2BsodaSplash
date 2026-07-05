import { NextResponse } from "next/server";
import { siteConfig } from "@/lib/config";
import { createSupabaseAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase";
import {
  generateQuoteNumber,
  normalizeEmail,
  validateQuoteRequest,
  type QuoteRequestInput
} from "@/lib/quotes";
import { getStaffFromRequest } from "@/lib/staff-auth";

function isSchemaCacheColumnError(error: { message?: string } | null, columns: string[]) {
  const message = error?.message || "";
  return message.includes("schema cache") && columns.some((column) => message.includes(column));
}

export async function POST(request: Request) {
  if (!hasSupabaseAdminEnv) {
    return NextResponse.json(
      { error: "Supabase is not configured. Add environment variables and run supabase/schema.sql." },
      { status: 503 }
    );
  }

  const input = (await request.json()) as QuoteRequestInput;
  const supabase = createSupabaseAdminClient();
  const staff = await getStaffFromRequest(request);

  if (staff) {
    input.referralSource = staff.role;
    input.referralName = staff.full_name || staff.email;
  }

  const errors = validateQuoteRequest(input);

  if (errors.length) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  const selectedIds = input.items.map((item) => item.flavourId);
  const { data: flavours, error: flavourError } = await supabase
    .from("flavours")
    .select("id,name,price_per_case")
    .in("id", selectedIds)
    .eq("is_active", true);

  if (flavourError) {
    return NextResponse.json({ error: flavourError.message }, { status: 500 });
  }

  const flavourById = new Map((flavours ?? []).map((flavour) => [flavour.id, flavour]));
  const items = input.items
    .filter((item) => item.quantity >= siteConfig.minimumCasesPerFlavour)
    .map((item) => {
      const flavour = flavourById.get(item.flavourId);
      if (!flavour) return null;
      return {
        flavour_id: flavour.id,
        flavour_name: flavour.name,
        quantity: item.quantity,
        price_per_case: flavour.price_per_case,
        line_total: flavour.price_per_case * item.quantity
      };
    })
    .filter(Boolean) as Array<{
      flavour_id: string;
      flavour_name: string;
      quantity: number;
      price_per_case: number;
      line_total: number;
    }>;

  if (!items.length) {
    return NextResponse.json({ errors: ["Select at least one active flavour."] }, { status: 400 });
  }

  let bdId: string | null = staff?.role === "bd" ? staff.id : null;
  if (!bdId && input.referralSource === "bd" && input.referralName?.trim()) {
    const { data: bd } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "bd")
      .eq("is_active", true)
      .ilike("full_name", `%${input.referralName.trim()}%`)
      .maybeSingle();
    bdId = bd?.id ?? null;
  }

  const subtotal = items.reduce((total, item) => total + item.line_total, 0);
  const quoteNumber = generateQuoteNumber();

  const baseQuoteInsert = {
    quote_number: quoteNumber,
    customer_name: input.customerName.trim(),
    email: normalizeEmail(input.email),
    phone: input.phone.trim(),
    business_name: input.businessName?.trim() || null,
    business_type: input.businessType,
    referral_source: input.referralSource,
    referral_name: input.referralName?.trim() || null,
    bd_id: bdId,
    assigned_to: bdId,
    note: input.note?.trim() || null,
    status: "submitted",
    subtotal,
    total: subtotal,
    created_by: staff?.id || null
  };

  let { data: quote, error: quoteError } = await supabase
    .from("quotes")
    .insert({
      ...baseQuoteInsert,
      discount_amount: 0,
      tax_amount: 0,
      additional_charges: 0,
      payment_status: "pending",
      invoice_version: 0
    })
    .select("id,quote_number,email")
    .single();

  if (isSchemaCacheColumnError(quoteError, ["additional_charges", "payment_status", "invoice_version", "tax_amount", "discount_amount"])) {
    const retry = await supabase
      .from("quotes")
      .insert(baseQuoteInsert)
      .select("id,quote_number,email")
      .single();
    quote = retry.data;
    quoteError = retry.error;
  }

  if (quoteError) {
    return NextResponse.json({ error: quoteError.message }, { status: 500 });
  }

  if (!quote) {
    return NextResponse.json({ error: "Quote could not be created." }, { status: 500 });
  }

  const { error: itemError } = await supabase
    .from("quote_items")
    .insert(items.map((item) => ({ ...item, quote_id: quote.id })));

  if (itemError) {
    return NextResponse.json({ error: itemError.message }, { status: 500 });
  }

  await supabase.from("quote_status_events").insert({
    quote_id: quote.id,
    from_status: null,
    to_status: "submitted",
    actor_role: "customer",
    note: "Quote request submitted from public website."
  });

  return NextResponse.json({
    quoteNumber: quote.quote_number,
    trackUrl: `${siteConfig.domain}/track?quote=${encodeURIComponent(quote.quote_number)}&email=${encodeURIComponent(quote.email)}`
  });
}
