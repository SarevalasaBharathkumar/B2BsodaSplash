import { NextResponse } from "next/server";
import { createSupabaseAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase";
import { normalizeEmail } from "@/lib/quotes";
import { sendTrackingCodeEmail } from "@/lib/emails";

export async function POST(request: Request) {
  if (!hasSupabaseAdminEnv) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const { quoteNumber, email } = await request.json();
  const normalizedEmail = normalizeEmail(String(email || ""));

  const supabase = createSupabaseAdminClient();
  const { data: quote, error } = await supabase
    .from("quotes")
    .select("id,email,quote_number,customer_name")
    .eq("quote_number", String(quoteNumber || "").trim())
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!quote) {
    return NextResponse.json({ error: "No matching quote found." }, { status: 404 });
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  const { error: otpError } = await supabase.from("tracking_otps").insert({
    quote_id: quote.id,
    email: normalizedEmail,
    code,
    expires_at: expiresAt
  });

  if (otpError) {
    return NextResponse.json({ error: otpError.message }, { status: 500 });
  }

  const emailResult = await sendTrackingCodeEmail({
    to: normalizedEmail,
    customerName: quote.customer_name || "there",
    quoteNumber: quote.quote_number,
    code
  });

  return NextResponse.json({
    ok: true,
    emailed: emailResult.sent,
    message: emailResult.sent
      ? "Verification code emailed."
      : "Verification code generated, but email is not configured.",
    devCode: emailResult.sent ? undefined : code
  });
}
