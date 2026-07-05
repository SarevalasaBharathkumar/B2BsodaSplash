"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { formatINR } from "@/lib/flavours";
import { getNextStage, orderStages, stageLabels, type OrderStage } from "@/lib/config";

type OrderItem = {
  id: string;
  flavour_id?: string | null;
  flavour_name: string;
  quantity: number;
  price_per_case: number;
  line_total: number;
};

type OrderQuote = {
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
  status: OrderStage;
  subtotal: number;
  discount_type: "percentage" | "flat" | null;
  discount_value: number;
  discount_amount: number;
  tax_amount: number;
  additional_charges: number;
  total: number;
  payment_status: "pending" | "partial" | "paid" | "refunded";
  invoice_version: number;
  latest_invoice_number?: string | null;
  finalized_at?: string | null;
  quote_items: OrderItem[];
};

type LoadedOrder = {
  quote: OrderQuote;
  latestInvoice?: {
    invoice_number: string;
    version: number;
    pdf_url?: string | null;
    emailed_at?: string | null;
  } | null;
};

type EditableItem = OrderItem;

export default function OrderEditor({ quoteNumber }: { quoteNumber: string }) {
  const [data, setData] = useState<LoadedOrder | null>(null);
  const [items, setItems] = useState<EditableItem[]>([]);
  const [message, setMessage] = useState("Loading order...");
  const [saving, setSaving] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  async function readJsonResponse(response: Response) {
    const text = await response.text();
    if (!text) return {};

    try {
      return JSON.parse(text);
    } catch {
      return { error: text || "The server returned an empty response." };
    }
  }

  useEffect(() => {
    async function load() {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;

        if (!token) {
          window.location.href = "/login";
          return;
        }

        const response = await fetch(`/api/orders/${encodeURIComponent(quoteNumber)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const result = await readJsonResponse(response);
        if (!response.ok) throw new Error(result.error || "Unable to load order.");
        setData(result);
        setItems(result.quote.quote_items);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Unable to load order.");
      }
    }

    load();
  }, [quoteNumber]);

  function updateField<K extends keyof OrderQuote>(key: K, value: OrderQuote[K]) {
    if (!data) return;
    setData({ ...data, quote: { ...data.quote, [key]: value } });
  }

  function updateItem(index: number, key: keyof EditableItem, value: string | number) {
    setItems((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...item, [key]: value } : item))
    );
  }

  const subtotal = items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.price_per_case || 0), 0);
  const discountAmount =
    data?.quote.discount_type === "percentage"
      ? Math.round((subtotal * Number(data.quote.discount_value || 0)) / 100)
      : Number(data?.quote.discount_value || 0);
  const grandTotal = Math.max(
    0,
    subtotal - discountAmount + Number(data?.quote.tax_amount || 0) + Number(data?.quote.additional_charges || 0)
  );

  async function save() {
    if (!data) return;
    setSaving(true);
    setMessage("");

    try {
      const supabase = createSupabaseBrowserClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Login required.");

      const response = await fetch(`/api/orders/${encodeURIComponent(quoteNumber)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          customerName: data.quote.customer_name,
          email: data.quote.email,
          phone: data.quote.phone,
          businessName: data.quote.business_name,
          businessType: data.quote.business_type,
          referralSource: data.quote.referral_source,
          referralName: data.quote.referral_name,
          note: data.quote.note,
          internalNote: data.quote.internal_note,
          paymentStatus: data.quote.payment_status,
          discountType: data.quote.discount_type,
          discountValue: data.quote.discount_value,
          taxAmount: data.quote.tax_amount,
          additionalCharges: data.quote.additional_charges,
          items: items.map((item) => ({
            id: item.id,
            flavour_id: item.flavour_id,
            flavour_name: item.flavour_name,
            quantity: Number(item.quantity),
            price_per_case: Number(item.price_per_case)
          })),
          regenerateInvoice: data.quote.status === "confirmed" || Boolean(data.quote.finalized_at)
        })
      });
      const result = await readJsonResponse(response);
      if (!response.ok) throw new Error(result.error || "Unable to save order.");
      setMessage(result.warning || result.message || "Order saved.");
      if (result.invoice?.version) {
        setData((current) =>
          current
            ? {
                ...current,
                quote: {
                  ...current.quote,
                  subtotal,
                  discount_amount: discountAmount,
                  total: grandTotal,
                  invoice_version: result.invoice.version,
                  latest_invoice_number: result.invoice.invoiceNumber || current.quote.latest_invoice_number
                },
                latestInvoice: {
                  invoice_number:
                    result.invoice.invoiceNumber ||
                    current.latestInvoice?.invoice_number ||
                    current.quote.latest_invoice_number ||
                    "Latest invoice",
                  version: result.invoice.version,
                  pdf_url: result.invoice.pdfUrl || current.latestInvoice?.pdf_url || null,
                  emailed_at: new Date().toISOString()
                }
              }
            : current
        );
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save order.");
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(nextStatus: OrderStage, note?: string) {
    if (!data) return;
    setUpdatingStatus(true);
    setMessage("");

    try {
      const supabase = createSupabaseBrowserClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Login required.");

      const response = await fetch(`/api/orders/${encodeURIComponent(quoteNumber)}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ nextStatus, note })
      });
      const result = await readJsonResponse(response);
      if (!response.ok) throw new Error(result.error || "Unable to update order status.");

      setData((current) =>
        current
          ? {
              ...current,
              quote: {
                ...current.quote,
                status: result.status || nextStatus,
                finalized_at:
                  (result.status || nextStatus) === "confirmed"
                    ? current.quote.finalized_at || new Date().toISOString()
                    : current.quote.finalized_at
              }
            }
          : current
      );
      setMessage(result.warning || `Order moved to ${stageLabels[result.status as OrderStage] || stageLabels[nextStatus]}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update order status.");
    } finally {
      setUpdatingStatus(false);
    }
  }

  if (!data) {
    return <div className="setup-card"><h2>{message}</h2><p>Use this page to revise the finalized order before the invoice is sent.</p></div>;
  }

  const quote = data.quote;
  const nextStage = getNextStage(quote.status);
  const currentStageIndex = orderStages.indexOf(quote.status as (typeof orderStages)[number]);

  return (
    <section className="order-editor-shell">
      <header className="order-editor-header">
        <div>
          <span>ORDER EDITOR</span>
          <h1>{quote.quote_number}</h1>
          <p>
            Current status: {stageLabels[quote.status]} · Payment: {quote.payment_status}
            {quote.latest_invoice_number ? ` · Latest invoice ${quote.latest_invoice_number}` : ""}
          </p>
        </div>
        <div className="order-editor-actions">
          <a className="button ghost" href={quote.status === "confirmed" ? "/admin" : "/bd"}>Back to dashboard</a>
          {quote.status !== "cancelled" && (
            <button type="button" className="button danger" onClick={() => updateStatus("cancelled", "Order cancelled from staff order editor.")} disabled={updatingStatus || saving}>
              Cancel order
            </button>
          )}
          <button type="button" className="button primary" onClick={save} disabled={saving}>
            {saving ? "Saving..." : "Save and regenerate invoice"}
          </button>
        </div>
      </header>

      <section className="order-path-card">
        <div className="order-path-header">
          <span>ORDER PATH</span>
          <strong>{quote.status === "cancelled" ? "Cancelled" : `Current stage: ${stageLabels[quote.status]}`}</strong>
        </div>
        <div className={`order-path ${quote.status === "cancelled" ? "is-cancelled" : ""}`}>
          {orderStages.map((stage, index) => {
            const isCurrent = quote.status === stage;
            const isComplete = currentStageIndex >= 0 && index < currentStageIndex;
            const isNext = nextStage === stage;
            return (
              <button
                type="button"
                className={`path-step ${isComplete ? "complete" : ""} ${isCurrent ? "current" : ""} ${isNext ? "next" : ""}`}
                disabled={!isNext || updatingStatus || saving || quote.status === "cancelled"}
                onClick={() => updateStatus(stage)}
                key={stage}
              >
                <i />
                <span>{stageLabels[stage]}</span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="order-editor-grid">
        <section className="setup-card">
          <span>ORDER DETAILS</span>
          <div className="form-grid">
            <label>
              Customer name
              <input value={quote.customer_name} onChange={(event) => updateField("customer_name", event.target.value)} />
            </label>
            <label>
              Email
              <input type="email" value={quote.email} onChange={(event) => updateField("email", event.target.value)} />
            </label>
            <label>
              Phone
              <input value={quote.phone} onChange={(event) => updateField("phone", event.target.value)} />
            </label>
            <label>
              Business name
              <input value={quote.business_name || ""} onChange={(event) => updateField("business_name", event.target.value)} />
            </label>
            <label>
              Business type
              <input value={quote.business_type} onChange={(event) => updateField("business_type", event.target.value)} />
            </label>
            <label>
              Payment status
              <select value={quote.payment_status} onChange={(event) => updateField("payment_status", event.target.value as OrderQuote["payment_status"])}>
                <option value="pending">Pending</option>
                <option value="partial">Partial</option>
                <option value="paid">Paid</option>
                <option value="refunded">Refunded</option>
              </select>
            </label>
            <label className="full">
              Note for customer
              <textarea value={quote.note || ""} onChange={(event) => updateField("note", event.target.value)} />
            </label>
            <label className="full">
              Internal note
              <textarea value={quote.internal_note || ""} onChange={(event) => updateField("internal_note", event.target.value)} />
            </label>
          </div>
        </section>

        <section className="setup-card">
          <span>PRICING</span>
          <div className="form-grid">
            <label>
              Discount type
              <select value={quote.discount_type || "flat"} onChange={(event) => updateField("discount_type", event.target.value as OrderQuote["discount_type"])}>
                <option value="flat">Flat</option>
                <option value="percentage">Percentage</option>
              </select>
            </label>
            <label>
              Discount value
              <input type="number" value={quote.discount_value} onChange={(event) => updateField("discount_value", Number(event.target.value))} />
            </label>
            <label>
              Taxes
              <input type="number" value={quote.tax_amount} onChange={(event) => updateField("tax_amount", Number(event.target.value))} />
            </label>
            <label>
              Additional charges
              <input type="number" value={quote.additional_charges} onChange={(event) => updateField("additional_charges", Number(event.target.value))} />
            </label>
          </div>
          <div className="quote-summary-preview">
            <div><span>Subtotal</span><strong>{formatINR(subtotal)}</strong></div>
            <div><span>Discount</span><strong>-{formatINR(discountAmount)}</strong></div>
            <div><span>Taxes</span><strong>{formatINR(Number(quote.tax_amount || 0))}</strong></div>
            <div><span>Additional charges</span><strong>{formatINR(Number(quote.additional_charges || 0))}</strong></div>
            <div className="summary-total"><span>Grand total</span><strong>{formatINR(grandTotal)}</strong></div>
          </div>
        </section>
      </div>

      <section className="dashboard-table">
        <div className="table-title">
          <h2>Line items</h2>
          <p>Adjust quantities and unit prices before issuing the invoice.</p>
        </div>
        <div className="table-row table-head order-item-grid">
          <span>Item</span>
          <span>Quantity</span>
          <span>Unit price</span>
          <span>Line total</span>
        </div>
        {items.map((item, index) => (
          <div className="table-row order-item-grid" key={item.id}>
            <strong>{item.flavour_name}</strong>
            <input type="number" min="1" value={item.quantity} onChange={(event) => updateItem(index, "quantity", Number(event.target.value))} />
            <input type="number" min="0" value={item.price_per_case} onChange={(event) => updateItem(index, "price_per_case", Number(event.target.value))} />
            <strong>{formatINR(item.quantity * item.price_per_case)}</strong>
          </div>
        ))}
      </section>

      {message && <div className="form-message">{message}</div>}

      {data.latestInvoice && (
        <section className="setup-card">
          <span>LATEST INVOICE</span>
          <h2>{data.latestInvoice.invoice_number}</h2>
          <p>{data.latestInvoice.emailed_at ? "Already emailed to the customer." : "Ready to send or resend."}</p>
          {data.latestInvoice.pdf_url && (
            <a className="button ghost invoice-link" href={data.latestInvoice.pdf_url} target="_blank" rel="noreferrer">
              Open PDF invoice
            </a>
          )}
        </section>
      )}
    </section>
  );
}
