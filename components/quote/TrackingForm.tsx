"use client";

import { useState } from "react";
import { formatINR } from "@/lib/flavours";
import { orderStages, stageLabels } from "@/lib/config";

type TrackedQuote = {
  quote_number: string;
  customer_name: string;
  business_name?: string;
  status: keyof typeof stageLabels;
  statusLabel: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  additional_charges: number;
  total: number;
  payment_status?: string;
  latest_invoice_number?: string | null;
  invoice_version?: number;
  quote_items: Array<{ flavour_name: string; quantity: number; price_per_case: number; line_total: number }>;
  quote_status_events: Array<{ to_status: keyof typeof stageLabels; created_at: string; note?: string }>;
};

export default function TrackingForm({
  initialQuote = "",
  initialEmail = ""
}: {
  initialQuote?: string;
  initialEmail?: string;
}) {
  const [quoteNumber, setQuoteNumber] = useState(initialQuote);
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [message, setMessage] = useState("");
  const [quote, setQuote] = useState<TrackedQuote | null>(null);

  async function requestCode() {
    setMessage("");
    const response = await fetch("/api/track/request-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quoteNumber, email })
    });
    const data = await response.json();
    if (!response.ok) return setMessage(data.error || "Unable to send code.");
    setCodeSent(true);
    setMessage(data.devCode ? `Development code: ${data.devCode}` : "Check your email for the verification code.");
  }

  async function verifyCode() {
    setMessage("");
    const response = await fetch("/api/track/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quoteNumber, email, code })
    });
    const data = await response.json();
    if (!response.ok) return setMessage(data.error || "Unable to verify code.");
    setQuote(data.quote);
  }

  if (quote) {
    const completed = new Set(quote.quote_status_events.map((event) => event.to_status));
    return (
      <div className="tracking-result">
        <div className="tracking-title">
          <span>{quote.quote_number}</span>
          <h1>{quote.statusLabel}</h1>
          <p>
            Order request for {quote.customer_name}
            {quote.business_name ? ` · ${quote.business_name}` : ""}
          </p>
        </div>
        <div className="timeline">
          {orderStages.map((stage) => {
            const event = quote.quote_status_events.find((item) => item.to_status === stage);
            const active = completed.has(stage) || quote.status === stage;
            return (
              <div className={active ? "complete" : ""} key={stage}>
                <i />
                <span>
                  <strong>{stageLabels[stage]}</strong>
                  <small>{event ? new Date(event.created_at).toLocaleString("en-IN") : "Pending"}</small>
                </span>
              </div>
            );
          })}
        </div>
        <div className="tracked-items">
          {quote.quote_items.map((item) => (
            <div key={item.flavour_name}>
              <span>
                {item.flavour_name} x {item.quantity}
              </span>
              <strong>{formatINR(item.line_total)}</strong>
            </div>
          ))}
          {quote.discount_amount > 0 && (
            <div>
              <span>Discount</span>
              <strong>-{formatINR(quote.discount_amount)}</strong>
            </div>
          )}
          {quote.tax_amount > 0 && (
            <div>
              <span>Taxes</span>
              <strong>{formatINR(quote.tax_amount)}</strong>
            </div>
          )}
          {quote.additional_charges > 0 && (
            <div>
              <span>Additional charges</span>
              <strong>{formatINR(quote.additional_charges)}</strong>
            </div>
          )}
          {(quote.latest_invoice_number || quote.payment_status) && (
            <div>
              <span>Invoice</span>
              <strong>
                {quote.latest_invoice_number || `V${String(quote.invoice_version || 1).padStart(2, "0")}`}
                {quote.payment_status ? ` · ${quote.payment_status}` : ""}
              </strong>
            </div>
          )}
          <div className="summary-total">
            <span>Total</span>
            <strong>{formatINR(quote.total)}</strong>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tracking-card">
      <span>PRIVATE ORDER TRACKING</span>
      <h1>Track your request.</h1>
      <p>Enter the quote number and email used for your request.</p>
      <label>
        Quote number
        <input value={quoteNumber} onChange={(event) => setQuoteNumber(event.target.value)} placeholder="SS-260701-ABCDE" />
      </label>
      <label>
        Email
        <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
      </label>
      {codeSent && (
        <label>
          6-digit verification code
          <input inputMode="numeric" maxLength={6} value={code} onChange={(event) => setCode(event.target.value)} />
        </label>
      )}
      {message && <p className="form-message">{message}</p>}
      <button type="button" className="button primary" onClick={codeSent ? verifyCode : requestCode}>
        {codeSent ? "Verify and Track" : "Send Verification Code"}
      </button>
    </div>
  );
}
