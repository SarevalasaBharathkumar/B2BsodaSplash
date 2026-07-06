"use client";

import { useEffect, useMemo, useState } from "react";
import { defaultProducts, formatINR, type PublicProduct } from "@/lib/flavours";
import { hasSupabaseEnv, createSupabaseBrowserClient } from "@/lib/supabase";
import Image from "next/image";

type Details = {
  customerName: string;
  email: string;
  phone: string;
  businessName: string;
  businessType: string;
  referralSource: string;
  referralName: string;
  note: string;
};

type PublicTeamMember = {
  id: string;
  name: string;
};

type StaffProfile = {
  full_name?: string | null;
  email: string;
  role: "admin" | "bd";
};

const emptyDetails: Details = {
  customerName: "",
  email: "",
  phone: "",
  businessName: "",
  businessType: "",
  referralSource: "",
  referralName: "",
  note: ""
};

export default function QuoteRequestForm({
  initialProducts,
  initialTeam
}: {
  initialProducts?: PublicProduct[];
  initialTeam?: PublicTeamMember[];
}) {
  const [step, setStep] = useState(() => {
    if (typeof window === "undefined") return 1;
    const savedStep = Number(window.sessionStorage.getItem("quoteStep") || 1);
    return [1, 2, 3].includes(savedStep) ? savedStep : 1;
  });
  const [products, setProducts] = useState<PublicProduct[]>(initialProducts ?? defaultProducts);
  const [activeProductId, setActiveProductId] = useState((initialProducts ?? defaultProducts)[0]?.id ?? "");
  const [team, setTeam] = useState<PublicTeamMember[]>(initialTeam ?? []);
  const [staffProfile, setStaffProfile] = useState<StaffProfile | null>(null);
  const [details, setDetails] = useState<Details>(emptyDetails);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ quoteNumber: string; trackUrl: string } | null>(null);

  useEffect(() => {
    window.sessionStorage.setItem("quoteStep", String(step));
  }, [step]);

  useEffect(() => {
    window.sessionStorage.setItem("quoteProductId", activeProductId);
  }, [activeProductId]);

  useEffect(() => {
    window.sessionStorage.setItem("quoteDetails", JSON.stringify(details));
  }, [details]);

  useEffect(() => {
    window.sessionStorage.setItem("quoteQuantities", JSON.stringify(quantities));
  }, [quantities]);

  useEffect(() => {
    if (initialProducts?.length) {
      setProducts(initialProducts);
      setActiveProductId((current) => current || window.sessionStorage.getItem("quoteProductId") || initialProducts[0].id);
    } else {
      fetch("/api/products")
        .then((response) => response.json())
        .then((data) => {
          if (!data.products?.length) return;
          setProducts(data.products);
          setActiveProductId((current) => current || window.sessionStorage.getItem("quoteProductId") || data.products[0].id);
        })
        .catch(() => undefined);
    }

    if (initialTeam?.length) {
      setTeam(initialTeam);
    } else {
      fetch("/api/team")
        .then((response) => response.json())
        .then((data) => setTeam(data.team ?? []))
        .catch(() => undefined);
    }
  }, [initialProducts, initialTeam]);

  useEffect(() => {
    try {
      const savedDetails = window.sessionStorage.getItem("quoteDetails");
      const savedQuantities = window.sessionStorage.getItem("quoteQuantities");
      const savedProductId = window.sessionStorage.getItem("quoteProductId");
      if (savedDetails) setDetails(JSON.parse(savedDetails));
      if (savedQuantities) setQuantities(JSON.parse(savedQuantities));
      if (savedProductId) setActiveProductId(savedProductId);
    } catch {
      window.sessionStorage.removeItem("quoteDetails");
      window.sessionStorage.removeItem("quoteQuantities");
    }
  }, []);

  useEffect(() => {
    async function loadStaffProfile() {
      if (!hasSupabaseEnv) return;

      const supabase = createSupabaseBrowserClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (!userId) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name,email,role,is_active")
        .eq("id", userId)
        .maybeSingle();

      if (!profile?.is_active) return;

      setStaffProfile(profile);
      setDetails((current) => ({
        ...current,
        referralSource: profile.role,
        referralName: profile.full_name || profile.email
      }));
    }

    loadStaffProfile();
  }, []);

  const selected = useMemo(
    () =>
      products
        .flatMap((product) => product.flavours)
        .filter((flavour) => (quantities[flavour.id] || 0) > 0)
        .map((flavour) => ({
          ...flavour,
          quantity: quantities[flavour.id],
          lineTotal: flavour.price_per_case * quantities[flavour.id]
        })),
    [products, quantities]
  );

  const activeProduct = products.find((product) => product.id === activeProductId) ?? products[0];
  const subtotal = selected.reduce((total, item) => total + item.lineTotal, 0);

  function updateDetail(field: keyof Details, value: string) {
    setDetails((current) => ({ ...current, [field]: value }));
  }

  function setQuantity(id: string, quantity: number) {
    setQuantities((current) => ({ ...current, [id]: Math.max(0, quantity) }));
  }

  function validateCurrentStep() {
    setError("");
    if (step === 1) {
      if (!details.customerName || !details.email.includes("@") || !details.phone || !details.businessType) {
        setError("Complete your name, valid email, phone number, and business type.");
        return false;
      }
    }
    if (step === 2 && selected.length === 0) {
      setError("Select at least one flavour and quantity.");
      return false;
    }
    if (step === 2 && !staffProfile && !details.referralSource) {
      setError("Select how you heard about us.");
      return false;
    }
    if (step === 2 && !staffProfile && details.referralSource === "bd" && !details.referralName) {
      setError("Select the salesperson who referred you.");
      return false;
    }
    return true;
  }

  async function submitQuote() {
    if (!confirmed) {
      setError("Confirm that the order details are correct.");
      return;
    }

    setSubmitting(true);
    setError("");

    let accessToken: string | undefined;
    if (hasSupabaseEnv) {
      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase.auth.getSession();
      accessToken = data.session?.access_token;
    }

    const response = await fetch("/api/quotes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
      },
      body: JSON.stringify({
        ...details,
        items: selected.map((item) => ({ flavourId: item.id, quantity: item.quantity }))
      })
    });
    const data = await response.json();
    setSubmitting(false);

    if (!response.ok) {
      setError(data.error || data.errors?.join(" ") || "Unable to submit the request.");
      return;
    }

    setResult(data);
  }

  if (result) {
    return (
      <div className="quote-success">
        <span>REQUEST RECEIVED</span>
        <h1>Thank you.</h1>
        <p>Your quote number is <strong>{result.quoteNumber}</strong>.</p>
        <p>Our team will call you within 24 hours to confirm pricing and availability.</p>
        <a className="button primary" href="/">Back to homepage</a>
      </div>
    );
  }

  return (
    <div className="quote-shell">
      <div className="quote-header">
        <div>
          <span>WHOLESALE REQUEST</span>
          <h1>Request a quote.</h1>
          <p>No online payment. We confirm every order by phone.</p>
        </div>
        <div className="step-indicator">
          {[1, 2, 3].map((number) => (
            <button
              type="button"
              key={number}
              className={step === number ? "active" : step > number ? "done" : ""}
              onClick={() => number < step && setStep(number)}
            >
              {number}
            </button>
          ))}
        </div>
      </div>

      <div className="quote-body">
        <div className="quote-main">
          {step === 1 && (
            <div className="form-grid">
              <label>Contact name<input value={details.customerName} onChange={(event) => updateDetail("customerName", event.target.value)} /></label>
              <label>Email<input type="email" value={details.email} onChange={(event) => updateDetail("email", event.target.value)} /></label>
              <label>Phone<input value={details.phone} onChange={(event) => updateDetail("phone", event.target.value)} /></label>
              <label>Business name <small>Optional</small><input value={details.businessName} onChange={(event) => updateDetail("businessName", event.target.value)} /></label>
              <label className="full">Business type
                <select value={details.businessType} onChange={(event) => updateDetail("businessType", event.target.value)}>
                  <option value="">Select business type</option>
                  <option value="hotel">Hotel</option>
                  <option value="restaurant">Restaurant</option>
                  <option value="shopkeeper">Retail / Shopkeeper</option>
                  <option value="corporate">Corporate office</option>
                  <option value="cinema">Cinema / Venue</option>
                  <option value="event">Event planner</option>
                  <option value="other">Other</option>
                </select>
              </label>
            </div>
          )}

          {step === 2 && (
            <>
              <div className="quote-product-picker" role="tablist" aria-label="Products">
                {products.map((product) => (
                  <button
                    type="button"
                    className={`quote-product ${activeProduct?.id === product.id ? "active" : ""}`}
                    onClick={() => setActiveProductId(product.id)}
                    key={product.id}
                    role="tab"
                    aria-selected={activeProduct?.id === product.id}
                  >
                    {product.image_url && (
                      <Image
                        className="product-card-image"
                        src={product.image_url}
                        alt={product.name}
                        width={180}
                        height={100}
                        style={{ objectFit: "cover" }}
                      />
                    )}
                    <span>{product.name}</span>
                    <strong>{product.flavours.length} flavours</strong>
                    <small>{product.description || "Select to view flavours"}</small>
                  </button>
                ))}
              </div>
              <div className="order-options">
                {activeProduct?.flavours.map((flavour) => {
                  const quantity = quantities[flavour.id] || 0;
                  return (
                    <article className={quantity ? "selected" : ""} key={flavour.id}>
                      <button type="button" className="flavour-select" onClick={() => setQuantity(flavour.id, quantity ? 0 : 1)}>
                        <span className="flavour-dot" style={{ background: flavour.color }} />
                        <span><strong>{flavour.name}</strong><small>{formatINR(flavour.price_per_case)} / case</small></span>
                        <b>{quantity ? "Selected" : "Add"}</b>
                      </button>
                      {quantity > 0 && (
                        <div className="quantity-control">
                          <button type="button" onClick={() => setQuantity(flavour.id, quantity - 1)}>−</button>
                          <span>{quantity} cases</span>
                          <button type="button" onClick={() => setQuantity(flavour.id, quantity + 1)}>+</button>
                        </div>
                      )}
                    </article>
                  );
                })}
                {!activeProduct?.flavours.length && <p className="form-message">No active flavours are available for this product.</p>}
              </div>
              <div className="form-grid quote-notes">
                {staffProfile ? (
                  <label className="full">Handled by
                    <input value={`${staffProfile.full_name || staffProfile.email} (${staffProfile.role.toUpperCase()})`} disabled />
                  </label>
                ) : (
                  <>
                    <label>How did you hear about us?
                      <select value={details.referralSource} onChange={(event) => updateDetail("referralSource", event.target.value)}>
                        <option value="">Select source</option>
                        <option value="bd">Referred by salesperson</option>
                        <option value="google">Google</option>
                        <option value="social">Social media</option>
                        <option value="word-of-mouth">Word of mouth</option>
                        <option value="other">Other</option>
                      </select>
                    </label>
                    {details.referralSource === "bd" && (
                      <label>Salesperson
                        <select value={details.referralName} onChange={(event) => updateDetail("referralName", event.target.value)}>
                          <option value="">Select salesperson</option>
                          {team.map((member) => (
                            <option value={member.name} key={member.id}>{member.name}</option>
                          ))}
                        </select>
                      </label>
                    )}
                  </>
                )}
                <label className="full">Negotiation or delivery note<textarea rows={4} value={details.note} onChange={(event) => updateDetail("note", event.target.value)} /></label>
              </div>
            </>
          )}

          {step === 3 && (
            <div className="review-card">
              <div><span>Business details</span><button type="button" onClick={() => setStep(1)}>Edit</button></div>
              <p><strong>{details.customerName}</strong><br />{details.email} · {details.phone}<br />{details.businessName || "Business name not provided"} · {details.businessType}</p>
              <div><span>Order details</span><button type="button" onClick={() => setStep(2)}>Edit</button></div>
              {selected.map((item) => <p className="review-line" key={item.id}><span>{item.name} × {item.quantity}</span><strong>{formatINR(item.lineTotal)}</strong></p>)}
              {details.note && <p className="review-note">Note: {details.note}</p>}
              <label className="confirm-check"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} /> I confirm my order details are correct.</label>
            </div>
          )}

          {error && <p className="form-error">{error}</p>}
          <div className="form-actions">
            {step > 1 && <button type="button" className="button ghost" onClick={() => { setError(""); setStep(step - 1); }}>Back</button>}
            {step < 3 ? (
              <button type="button" className="button primary" onClick={() => validateCurrentStep() && setStep(step + 1)}>Continue</button>
            ) : (
              <button type="button" className="button primary" disabled={submitting} onClick={submitQuote}>{submitting ? "Submitting..." : "Submit Request"}</button>
            )}
          </div>
        </div>

        <aside className="quote-summary">
          <span>LIVE SUMMARY</span>
          {selected.length ? selected.map((item) => (
            <div key={item.id}><p>{item.name} × {item.quantity}</p><strong>{formatINR(item.lineTotal)}</strong></div>
          )) : <p>No flavours selected yet.</p>}
          <div className="summary-total"><p>Standard subtotal</p><strong>{formatINR(subtotal)}</strong></div>
          <small>Final pricing is confirmed after our call.</small>
        </aside>
      </div>
    </div>
  );
}
