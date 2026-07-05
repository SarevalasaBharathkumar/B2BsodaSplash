import { readFile } from "fs/promises";
import path from "path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { Resend } from "resend";
import { siteConfig } from "./config";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const companyName = "SodaSplash";
const invoiceBucket = "invoices";

export type InvoiceLineItem = {
  flavour_id?: string | null;
  flavour_name: string;
  quantity: number;
  price_per_case: number;
  line_total: number;
};

export type InvoiceQuote = {
  id: string;
  quote_number: string;
  customer_name: string;
  email: string;
  phone: string;
  business_name?: string | null;
  business_type: string;
  referral_source: string;
  referral_name?: string | null;
  note?: string | null;
  internal_note?: string | null;
  subtotal: number;
  discount_type?: "percentage" | "flat" | null;
  discount_value: number;
  discount_amount: number;
  tax_amount: number;
  additional_charges: number;
  total: number;
  payment_status?: "pending" | "partial" | "paid" | "refunded";
  invoice_version: number;
  latest_invoice_number?: string | null;
  finalized_at?: string | null;
};

export type InvoiceTotals = {
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  additionalCharges: number;
  total: number;
};

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amount);
}

function formatPdfCurrency(amount: number) {
  return `INR ${new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0
  }).format(amount)}`;
}

export function formatInvoiceDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(date);
}

export function generateInvoiceNumber(quoteNumber: string, version: number) {
  const trimmedQuote = quoteNumber.replace(/^SS-/, "");
  return `INV-${trimmedQuote}-V${String(version).padStart(2, "0")}`;
}

export function calculateInvoiceTotals(
  items: InvoiceLineItem[],
  discountType: InvoiceQuote["discount_type"],
  discountValue: number,
  taxAmount = 0,
  additionalCharges = 0
): InvoiceTotals {
  const subtotal = items.reduce((sum, item) => sum + item.line_total, 0);
  let discountAmount = 0;

  if (discountType === "percentage") {
    discountAmount = Math.round((subtotal * discountValue) / 100);
  } else if (discountType === "flat") {
    discountAmount = discountValue;
  }

  discountAmount = Math.max(0, Math.min(subtotal, discountAmount));
  const total = Math.max(0, subtotal - discountAmount + taxAmount + additionalCharges);

  return {
    subtotal,
    discountAmount,
    taxAmount,
    additionalCharges,
    total
  };
}

export function buildInvoiceSnapshot(
  quote: InvoiceQuote,
  items: InvoiceLineItem[],
  invoiceNumber: string,
  version: number,
  totals: InvoiceTotals
) {
  return {
    company: {
      name: companyName,
      supportEmail: siteConfig.supportEmail,
      supportPhone: siteConfig.supportPhone,
      domain: siteConfig.domain
    },
    invoice: {
      invoiceNumber,
      version,
      quoteNumber: quote.quote_number,
      issuedAt: new Date().toISOString(),
      paymentStatus: quote.payment_status || "pending"
    },
    customer: {
      name: quote.customer_name,
      email: quote.email,
      phone: quote.phone,
      businessName: quote.business_name || "",
      businessType: quote.business_type
    },
    order: {
      referralSource: quote.referral_source,
      referralName: quote.referral_name || "",
      note: quote.note || "",
      internalNote: quote.internal_note || "",
      finalizedAt: quote.finalized_at || null
    },
    items,
    totals
  };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildItemRows(items: InvoiceLineItem[]) {
  return items
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.flavour_name)}</td>
          <td align="center">${item.quantity}</td>
          <td align="right">${formatCurrency(item.price_per_case)}</td>
          <td align="right">${formatCurrency(item.line_total)}</td>
        </tr>
      `
    )
    .join("");
}

function buildInvoiceEmailHtml({
  customerName,
  quoteNumber,
  invoiceNumber,
  items,
  totals,
  isUpdated
}: {
  customerName: string;
  quoteNumber: string;
  invoiceNumber: string;
  items: InvoiceLineItem[];
  totals: InvoiceTotals;
  isUpdated: boolean;
}) {
  const rows = buildItemRows(items);
  const summaryTitle = isUpdated ? "Updated quotation summary" : "Quotation summary";

  return `
    <div style="margin:0;padding:0;background:#061522;font-family:Arial,Helvetica,sans-serif;color:#dce8ee">
      <div style="max-width:720px;margin:0 auto;padding:32px 20px 40px">
        <div style="background:#081e2b;border:1px solid rgba(143,232,245,.18);border-radius:18px;overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,.24)">
          <div style="padding:28px 30px;background:linear-gradient(135deg,#0a2433,#10395b)">
            <div style="font-size:12px;letter-spacing:.24em;text-transform:uppercase;color:#8fe8f5;font-weight:700">SodaSplash</div>
            <div style="font-size:30px;line-height:1.05;font-weight:800;margin-top:10px;color:#ffffff">${isUpdated ? "Your invoice has been updated." : "Your order has been confirmed."}</div>
            <div style="margin-top:10px;color:#c6d7df;font-size:14px">Invoice ${escapeHtml(invoiceNumber)} for quotation ${escapeHtml(quoteNumber)}.</div>
          </div>
          <div style="padding:30px">
            <p style="margin:0 0 18px;font-size:16px;color:#f3f7fa">Hello ${escapeHtml(customerName)}, thank you for choosing SodaSplash!</p>
            <p style="margin:0 0 24px;font-size:14px;line-height:1.8;color:#a9bfcb">Please find your invoice attached. The summary below reflects the latest approved order details and current payable amount.</p>

            <div style="font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#8fe8f5;font-weight:700;margin-bottom:14px">${summaryTitle}</div>
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#061722;border:1px solid rgba(143,232,245,.12);border-radius:14px;overflow:hidden">
              <thead>
                <tr style="background:rgba(143,232,245,.06);color:#dce8ee">
                  <th align="left" style="padding:12px 14px;font-size:12px">Item</th>
                  <th align="center" style="padding:12px 14px;font-size:12px">Qty</th>
                  <th align="right" style="padding:12px 14px;font-size:12px">Unit price</th>
                  <th align="right" style="padding:12px 14px;font-size:12px">Line total</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>

            <div style="margin-top:20px;background:#0a2433;border:1px solid rgba(143,232,245,.12);border-radius:14px;padding:16px 18px">
              <div style="display:flex;justify-content:space-between;margin:6px 0;color:#bfd0d8;font-size:14px"><span>Subtotal</span><strong>${formatCurrency(totals.subtotal)}</strong></div>
              <div style="display:flex;justify-content:space-between;margin:6px 0;color:#bfd0d8;font-size:14px"><span>Discount</span><strong>- ${formatCurrency(totals.discountAmount)}</strong></div>
              <div style="display:flex;justify-content:space-between;margin:6px 0;color:#bfd0d8;font-size:14px"><span>Taxes</span><strong>${formatCurrency(totals.taxAmount)}</strong></div>
              <div style="display:flex;justify-content:space-between;margin:6px 0;color:#bfd0d8;font-size:14px"><span>Additional charges</span><strong>${formatCurrency(totals.additionalCharges)}</strong></div>
              <div style="display:flex;justify-content:space-between;margin-top:12px;padding-top:12px;border-top:1px solid rgba(143,232,245,.12);color:#ffffff;font-size:18px"><span>Total amount payable</span><strong>${formatCurrency(totals.total)}</strong></div>
            </div>

            <p style="margin:24px 0 0;font-size:14px;line-height:1.8;color:#a9bfcb">If you have any questions, reply to this email or contact ${escapeHtml(siteConfig.supportEmail)}. We’ll keep your latest invoice version on record and only send the most recent approved pricing.</p>

            <div style="margin-top:26px;padding-top:18px;border-top:1px solid rgba(143,232,245,.12);color:#8aa5b3;font-size:12px;letter-spacing:.08em">
              SodaSplash · Premium wholesale goli soda · ${escapeHtml(siteConfig.domain)}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function wrapText(text: string, maxWidth: number, font: { widthOfTextAtSize(text: string, size: number): number }, size: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;
    if (font.widthOfTextAtSize(nextLine, size) <= maxWidth) {
      currentLine = nextLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) lines.push(currentLine);
  return lines;
}

async function loadLogoBytes() {
  return readFile(path.join(process.cwd(), "public", "assets", "logo.png"));
}

export async function renderInvoicePdf({
  quote,
  items,
  invoiceNumber,
  version,
  totals
}: {
  quote: InvoiceQuote;
  items: InvoiceLineItem[];
  invoiceNumber: string;
  version: number;
  totals: InvoiceTotals;
}) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const logoBytes = await loadLogoBytes();
  const logo = await pdfDoc.embedPng(logoBytes);

  const width = page.getWidth();
  const height = page.getHeight();
  const margin = 42;
  let cursorY = height - 42;
  const left = margin;
  const right = width - margin;

  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: rgb(0.97, 0.99, 1)
  });
  page.drawRectangle({
    x: 0,
    y: height - 124,
    width,
    height: 124,
    color: rgb(0.03, 0.12, 0.2)
  });
  page.drawImage(logo, {
    x: left,
    y: height - 96,
    width: 54,
    height: 54
  });
  page.drawText(companyName, {
    x: left + 68,
    y: height - 60,
    size: 20,
    font: fontBold,
    color: rgb(1, 1, 1)
  });
  page.drawText("Order confirmation invoice", {
    x: left + 68,
    y: height - 82,
    size: 11,
    font: fontRegular,
    color: rgb(0.75, 0.88, 0.93)
  });

  const invoiceMeta = [
    ["Invoice number", invoiceNumber],
    ["Quotation", quote.quote_number],
    ["Issue date", formatInvoiceDate()],
    ["Payment status", quote.payment_status || "pending"]
  ] as const;

  let metaX = right - 178;
  let metaY = height - 52;
  invoiceMeta.forEach(([label, value]) => {
    page.drawText(label, { x: metaX, y: metaY, size: 8, font: fontRegular, color: rgb(0.84, 0.9, 0.93) });
    page.drawText(String(value), { x: metaX, y: metaY - 12, size: 11, font: fontBold, color: rgb(1, 1, 1) });
    metaY -= 33;
  });

  cursorY = height - 160;
  page.drawText(`Hello ${quote.customer_name},`, {
    x: left,
    y: cursorY,
    size: 16,
    font: fontBold,
    color: rgb(0.04, 0.15, 0.25)
  });
  cursorY -= 24;

  const introLines = wrapText(
    "Thank you for choosing SodaSplash. This invoice reflects the latest approved order details, pricing adjustments, and payable amount.",
    500,
    fontRegular,
    11
  );
  introLines.forEach((line) => {
    page.drawText(line, { x: left, y: cursorY, size: 11, font: fontRegular, color: rgb(0.25, 0.36, 0.43) });
    cursorY -= 15;
  });

  cursorY -= 10;
  const sectionTitle = (title: string, y: number) => {
    page.drawText(title, { x: left, y, size: 11, font: fontBold, color: rgb(0.04, 0.15, 0.25) });
    page.drawLine({
      start: { x: left, y: y - 8 },
      end: { x: right, y: y - 8 },
      thickness: 1,
      color: rgb(0.8, 0.88, 0.92)
    });
    return y - 26;
  };

  cursorY = sectionTitle("Customer details", cursorY);
  const customerLines = [
    quote.customer_name,
    quote.business_name || quote.business_type,
    quote.email,
    quote.phone
  ];
  customerLines.forEach((line) => {
    page.drawText(line, { x: left, y: cursorY, size: 10.5, font: fontRegular, color: rgb(0.2, 0.31, 0.38) });
    cursorY -= 15;
  });
  cursorY -= 8;

  cursorY = sectionTitle("Order breakdown", cursorY);
  const tableY = cursorY;
  page.drawRectangle({ x: left, y: tableY - 18, width: right - left, height: 22, color: rgb(0.08, 0.24, 0.36) });
  page.drawText("Item", { x: left + 8, y: tableY - 5, size: 10, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText("Qty", { x: 290, y: tableY - 5, size: 10, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText("Unit price", { x: 360, y: tableY - 5, size: 10, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText("Line total", { x: 485, y: tableY - 5, size: 10, font: fontBold, color: rgb(1, 1, 1) });
  cursorY = tableY - 28;

  items.forEach((item, index) => {
    const rowTop = cursorY - index * 28;
    page.drawLine({
      start: { x: left, y: rowTop - 6 },
      end: { x: right, y: rowTop - 6 },
      thickness: 0.7,
      color: rgb(0.86, 0.91, 0.94)
    });
    page.drawText(item.flavour_name, { x: left + 8, y: rowTop, size: 10.2, font: fontRegular, color: rgb(0.12, 0.22, 0.3) });
    page.drawText(String(item.quantity), { x: 292, y: rowTop, size: 10.2, font: fontRegular, color: rgb(0.12, 0.22, 0.3) });
    page.drawText(formatPdfCurrency(item.price_per_case), { x: 360, y: rowTop, size: 10.2, font: fontRegular, color: rgb(0.12, 0.22, 0.3) });
    page.drawText(formatPdfCurrency(item.line_total), { x: 485, y: rowTop, size: 10.2, font: fontRegular, color: rgb(0.12, 0.22, 0.3) });
  });

  cursorY = cursorY - items.length * 28 - 8;

  const summaryX = 330;
  const summaryTop = cursorY;
  page.drawRectangle({
    x: summaryX,
    y: summaryTop - 132,
    width: right - summaryX,
    height: 132,
    color: rgb(0.93, 0.97, 0.99),
    borderColor: rgb(0.82, 0.9, 0.94),
    borderWidth: 1
  });

  const summaryRows = [
    ["Subtotal", totals.subtotal],
    ["Discount", -totals.discountAmount],
    ["Taxes", totals.taxAmount],
    ["Additional charges", totals.additionalCharges]
  ] as const;
  let summaryY = summaryTop - 26;
  summaryRows.forEach(([label, amount]) => {
    page.drawText(label, { x: summaryX + 12, y: summaryY, size: 10, font: fontRegular, color: rgb(0.22, 0.32, 0.39) });
    page.drawText(formatPdfCurrency(Math.abs(amount)), {
      x: right - 92,
      y: summaryY,
      size: 10,
      font: fontRegular,
      color: amount < 0 ? rgb(0.75, 0.18, 0.18) : rgb(0.12, 0.22, 0.3)
    });
    summaryY -= 22;
  });
  page.drawLine({
    start: { x: summaryX + 12, y: summaryY + 8 },
    end: { x: right - 12, y: summaryY + 8 },
    thickness: 1,
    color: rgb(0.79, 0.88, 0.92)
  });
  page.drawText("Total amount payable", {
    x: summaryX + 12,
    y: summaryY - 8,
    size: 10.5,
    font: fontBold,
    color: rgb(0.04, 0.15, 0.25)
  });
  page.drawText(formatPdfCurrency(totals.total), {
    x: right - 104,
    y: summaryY - 8,
    size: 13,
    font: fontBold,
    color: rgb(0.03, 0.28, 0.45)
  });

  cursorY = summaryTop - 160;
  const noteLines = wrapText(
    quote.note || "Thank you for your order. Please keep this invoice for your records.",
    500,
    fontRegular,
    10.2
  );
  page.drawText("Notes", { x: left, y: cursorY, size: 11, font: fontBold, color: rgb(0.04, 0.15, 0.25) });
  cursorY -= 18;
  noteLines.forEach((line) => {
    page.drawText(line, { x: left, y: cursorY, size: 10.2, font: fontRegular, color: rgb(0.24, 0.35, 0.42) });
    cursorY -= 14;
  });

  const footerY = 42;
  page.drawLine({
    start: { x: left, y: footerY + 32 },
    end: { x: right, y: footerY + 32 },
    thickness: 1,
    color: rgb(0.8, 0.88, 0.92)
  });
  page.drawText(`${companyName} · ${siteConfig.supportEmail} · ${siteConfig.supportPhone}`, {
    x: left,
    y: footerY + 14,
    size: 9,
    font: fontRegular,
    color: rgb(0.35, 0.45, 0.52)
  });
  page.drawText(`Most recent invoice version: ${version}`, {
    x: left,
    y: footerY,
    size: 9,
    font: fontRegular,
    color: rgb(0.35, 0.45, 0.52)
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

export async function uploadInvoicePdf({
  supabase,
  storagePath,
  pdfBuffer
}: {
  supabase: any;
  storagePath: string;
  pdfBuffer: Buffer;
}) {
  const { error: uploadError } = await supabase.storage.from(invoiceBucket).upload(storagePath, pdfBuffer, {
    contentType: "application/pdf",
    upsert: true
  });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data, error } = await supabase.storage.from(invoiceBucket).createSignedUrl(storagePath, 60 * 60 * 24 * 7);
  if (error) {
    return { storagePath, signedUrl: null };
  }

  return { storagePath, signedUrl: data?.signedUrl ?? null };
}

export async function sendInvoiceEmail({
  to,
  customerName,
  quoteNumber,
  invoiceNumber,
  items,
  totals,
  attachment,
  updated
}: {
  to: string;
  customerName: string;
  quoteNumber: string;
  invoiceNumber: string;
  items: InvoiceLineItem[];
  totals: InvoiceTotals;
  attachment: Buffer;
  updated: boolean;
}) {
  if (!resend) {
    return { sent: false, reason: "Missing RESEND_API_KEY" };
  }

  const from = process.env.RESEND_FROM_EMAIL || "SodaSplash <billing@sodasplash.me>";
  const subject = updated
    ? `SodaSplash updated invoice for ${quoteNumber}`
    : `SodaSplash order confirmation for ${quoteNumber}`;

  const html = buildInvoiceEmailHtml({
    customerName,
    quoteNumber,
    invoiceNumber,
    items,
    totals,
    isUpdated: updated
  });

  const result = await resend.emails.send({
    from,
    to,
    subject,
    html,
    attachments: [
      {
        filename: `${invoiceNumber}.pdf`,
        content: attachment.toString("base64")
      }
    ]
  });

  return { sent: true, result };
}

export async function sendOrderStatusEmail({
  to,
  customerName,
  quoteNumber,
  status
}: {
  to: string;
  customerName: string;
  quoteNumber: string;
  status: "shipped";
}) {
  if (!resend) {
    return { sent: false, reason: "Missing RESEND_API_KEY" };
  }

  const from = process.env.RESEND_FROM_EMAIL || "SodaSplash <billing@sodasplash.me>";
  const subject = `SodaSplash order shipped: ${quoteNumber}`;
  const headline = status === "shipped" ? "Your SodaSplash order has shipped." : "Your SodaSplash order was updated.";

  const html = `
    <div style="margin:0;padding:0;background:#061522;font-family:Arial,Helvetica,sans-serif;color:#dce8ee">
      <div style="max-width:680px;margin:0 auto;padding:32px 20px 40px">
        <div style="background:#081e2b;border:1px solid rgba(143,232,245,.18);border-radius:18px;overflow:hidden">
          <div style="padding:28px 30px;background:linear-gradient(135deg,#0a2433,#10395b)">
            <div style="font-size:12px;letter-spacing:.24em;text-transform:uppercase;color:#8fe8f5;font-weight:700">SodaSplash</div>
            <div style="font-size:28px;line-height:1.1;font-weight:800;margin-top:10px;color:#ffffff">${headline}</div>
            <div style="margin-top:10px;color:#c6d7df;font-size:14px">Order ${escapeHtml(quoteNumber)}</div>
          </div>
          <div style="padding:30px">
            <p style="margin:0 0 18px;font-size:16px;color:#f3f7fa">Hello ${escapeHtml(customerName)},</p>
            <p style="margin:0 0 22px;font-size:14px;line-height:1.8;color:#a9bfcb">Your SodaSplash order has moved to shipped. Our team will continue tracking it through delivery.</p>
            <p style="margin:0;font-size:14px;line-height:1.8;color:#a9bfcb">For help, contact ${escapeHtml(siteConfig.supportEmail)}.</p>
            <div style="margin-top:26px;padding-top:18px;border-top:1px solid rgba(143,232,245,.12);color:#8aa5b3;font-size:12px;letter-spacing:.08em">
              SodaSplash · Premium wholesale goli soda · ${escapeHtml(siteConfig.domain)}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  const result = await resend.emails.send({
    from,
    to,
    subject,
    html
  });

  return { sent: true, result };
}

export async function issueInvoiceForQuote({
  supabase,
  quote,
  items,
  reason = "confirmed"
}: {
  supabase: any;
  quote: InvoiceQuote;
  items: InvoiceLineItem[];
  reason?: "confirmed" | "edited";
}) {
  const totals = calculateInvoiceTotals(items, quote.discount_type, quote.discount_value, quote.tax_amount, quote.additional_charges);
  const { data: latestInvoice } = await supabase
    .from("invoices")
    .select("version")
    .eq("quote_id", quote.id)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const version = (latestInvoice?.version ?? 0) + 1;
  const invoiceNumber = generateInvoiceNumber(quote.quote_number, version);
  const snapshot = buildInvoiceSnapshot(quote, items, invoiceNumber, version, totals);
  const pdfBuffer = await renderInvoicePdf({ quote, items, invoiceNumber, version, totals });
  const storagePath = `${quote.quote_number}/invoice-v${String(version).padStart(2, "0")}.pdf`;
  const uploadResult = await uploadInvoicePdf({ supabase, storagePath, pdfBuffer });

  await supabase
    .from("invoices")
    .update({ is_latest: false })
    .eq("quote_id", quote.id);

  const invoiceInsert = {
    quote_id: quote.id,
    invoice_number: invoiceNumber,
    version,
    storage_path: uploadResult.storagePath,
    pdf_url: uploadResult.signedUrl,
    is_latest: true,
    emailed_to: quote.email,
    emailed_at: null,
    pricing_snapshot: snapshot,
    generated_at: new Date().toISOString()
  };

  let { data: invoiceRecord, error: invoiceError } = await supabase
    .from("invoices")
    .insert(invoiceInsert)
    .select("id,invoice_number,version,pdf_url,storage_path")
    .single();

  if (invoiceError?.message?.includes("emailed_at")) {
    const retryInsert = { ...invoiceInsert };
    delete (retryInsert as Partial<typeof invoiceInsert>).emailed_at;

    const retry = await supabase
      .from("invoices")
      .insert(retryInsert)
      .select("id,invoice_number,version,pdf_url,storage_path")
      .single();

    invoiceRecord = retry.data;
    invoiceError = retry.error;
  }

  if (invoiceError) {
    throw new Error(invoiceError.message);
  }

  const { error: quoteError } = await supabase
    .from("quotes")
    .update({
      subtotal: totals.subtotal,
      discount_amount: totals.discountAmount,
      tax_amount: totals.taxAmount,
      additional_charges: totals.additionalCharges,
      total: totals.total,
      invoice_version: version,
      latest_invoice_number: invoiceNumber,
      finalized_at: quote.finalized_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq("id", quote.id);

  if (quoteError) {
    throw new Error(quoteError.message);
  }

  const emailResult = await sendInvoiceEmail({
    to: quote.email,
    customerName: quote.customer_name,
    quoteNumber: quote.quote_number,
    invoiceNumber,
    items,
    totals,
    attachment: pdfBuffer,
    updated: reason === "edited"
  });

  if (emailResult.sent) {
    const { error: emailedAtError } = await supabase
      .from("invoices")
      .update({ emailed_at: new Date().toISOString() })
      .eq("id", invoiceRecord.id);

    if (emailedAtError && !emailedAtError.message.includes("emailed_at")) {
      throw new Error(emailedAtError.message);
    }
  }

  return {
    invoice: {
      id: invoiceRecord.id,
      invoiceNumber,
      version,
      storagePath: uploadResult.storagePath,
      pdfUrl: uploadResult.signedUrl,
      totals
    },
    emailResult
  };
}
