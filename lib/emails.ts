import { Resend } from "resend";
import { siteConfig } from "./config";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function sendTrackingCodeEmail({
  to,
  customerName,
  quoteNumber,
  code
}: {
  to: string;
  customerName: string;
  quoteNumber: string;
  code: string;
}) {
  if (!resend) {
    return { sent: false, reason: "Missing RESEND_API_KEY" };
  }

  const from = process.env.RESEND_FROM_EMAIL || "SodaSplash <billing@sodasplash.me>";
  const html = `
    <div style="margin:0;padding:0;background:#061522;font-family:Arial,Helvetica,sans-serif;color:#dce8ee">
      <div style="max-width:640px;margin:0 auto;padding:32px 20px 40px">
        <div style="background:#081e2b;border:1px solid rgba(143,232,245,.18);border-radius:18px;overflow:hidden">
          <div style="padding:26px 30px;background:linear-gradient(135deg,#0a2433,#10395b)">
            <div style="font-size:12px;letter-spacing:.24em;text-transform:uppercase;color:#8fe8f5;font-weight:700">SodaSplash</div>
            <div style="font-size:28px;line-height:1.1;font-weight:800;margin-top:10px;color:#ffffff">Track your order.</div>
            <div style="margin-top:10px;color:#c6d7df;font-size:14px">Order ${escapeHtml(quoteNumber)}</div>
          </div>
          <div style="padding:30px">
            <p style="margin:0 0 18px;font-size:16px;color:#f3f7fa">Hello ${escapeHtml(customerName)},</p>
            <p style="margin:0 0 20px;font-size:14px;line-height:1.8;color:#a9bfcb">Use this verification code to view your latest SodaSplash order status. The code expires in 10 minutes.</p>
            <div style="display:inline-block;margin:4px 0 22px;padding:14px 20px;background:#061722;border:1px solid rgba(143,232,245,.2);border-radius:10px;font-size:26px;letter-spacing:.24em;color:#ffffff;font-weight:800">${escapeHtml(code)}</div>
            <p style="margin:0;font-size:13px;line-height:1.7;color:#8aa5b3">If you did not request this code, you can ignore this email. For support, contact ${escapeHtml(siteConfig.supportEmail)}.</p>
          </div>
        </div>
      </div>
    </div>
  `;

  const result = await resend.emails.send({
    from,
    to,
    subject: `SodaSplash tracking code for ${quoteNumber}`,
    html
  });

  return { sent: true, result };
}
