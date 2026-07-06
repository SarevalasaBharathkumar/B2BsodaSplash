"use client";

import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import Hero3D from "@/components/landing/Hero3D";
import FlavourReveal from "@/components/landing/FlavourReveal";

const customers = [
  {
    title: "Hotels & Restaurants",
    text: "Case-based supply for regular service and guest experiences.",
    image: "/assets/biz_hotel.png",
    tag: "Hospitality",
  },
  {
    title: "Retail & Shops",
    text: "Recognisable flavours for everyday customer demand.",
    image: "/assets/biz_retail.png",
    tag: "Retail",
  },
  {
    title: "Offices & Events",
    text: "Flexible quantities for teams, meetings, and gatherings.",
    image: "/assets/biz_office.png",
    tag: "Corporate",
  },
  {
    title: "Cinemas & Venues",
    text: "Bulk beverage supply for high-footfall operations.",
    image: "/assets/biz_cinema.png",
    tag: "Venues",
  },
];

// Pile offset per card index — returns {x, y, rotate} for the stacked start
function getPileOffset(index: number, isMobile: boolean) {
  if (isMobile) {
    const xs = ["50%", "-50%", "50%", "-50%"];
    const ys = [80, 80, -80, -80];
    const rs = [-5, 5, -3, 3];
    return { x: xs[index] ?? 0, y: ys[index] ?? 0, rotate: rs[index] ?? 0 };
  } else {
    const xs = ["150%", "50%", "-50%", "-150%"];
    const ys = [15, 0, 0, 15];
    const rs = [-7, -2, 2, 7];
    return { x: xs[index] ?? 0, y: ys[index] ?? 0, rotate: rs[index] ?? 0 };
  }
}

export default function Home() {
  const [isMobile, setIsMobile] = useState(false);
  // mounted guard: ensures cards always start from pile position on cold server load
  const [mounted, setMounted]   = useState(false);

  // Refs for section-level InView detection
  const serveRef   = useRef<HTMLElement>(null);
  const processRef = useRef<HTMLElement>(null);

  // Use framer-motion useInView — reactive, no once:false hacks needed
  const serveInViewRaw   = useInView(serveRef,   { amount: 0.05 });
  const processInViewRaw = useInView(processRef, { amount: 0.1  });
  // Only trust InView after client has hydrated — prevents skipped animation on first load
  const serveInView   = mounted && serveInViewRaw;
  const processInView = mounted && processInViewRaw;

  useEffect(() => {
    // Mark as mounted after first client paint so initial pile position is committed
    setMounted(true);
  }, []);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1000);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <main>
      <Hero3D />
      <FlavourReveal />

      {/* ── Business types ─────────────────────────────────────────── */}
      <section className="serve section" id="customers" ref={serveRef}>
        <div className="section-kicker"><span /> MADE FOR BUSINESS</div>
        <div className="section-heading split-heading">
          <h2>Built for business.</h2>
          <p>SodaSplash serves businesses that need clear case pricing, multiple flavour options, and a straightforward ordering process.</p>
        </div>
        <div className="serve-grid">
          {customers.map(({ title, text, image, tag }, index) => {
            const pile = getPileOffset(index, isMobile);
            return (
              <motion.article
                className="serve-card"
                key={title}
                // Opacity is always 1 — only position/rotation animate in/out
                initial={{ x: pile.x, y: pile.y, rotate: pile.rotate, scale: 0.88 }}
                animate={
                  serveInView
                    ? { x: 0, y: 0, rotate: 0, scale: 1 }
                    : { x: pile.x, y: pile.y, rotate: pile.rotate, scale: 0.88 }
                }
                transition={{
                  type: "spring",
                  stiffness: 70,
                  damping: 14,
                  delay: serveInView ? index * 0.08 : 0,
                }}
              >
                <div className="serve-card-image">
                  <img src={image} alt={title} />
                  <span className="serve-card-tag">{tag}</span>
                </div>
                <div className="serve-card-body">
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </motion.article>
            );
          })}
        </div>
      </section>

      {/* ── How ordering works ─────────────────────────────────────── */}
      <section className="process section" id="process" ref={processRef}>
        <div className="process-header">
          <div className="section-kicker light"><span /> SIMPLE BY DESIGN</div>
          <h2>How ordering works.</h2>
        </div>
        <div className="process-grid">
          <motion.div
            className="process-art"
            aria-hidden="true"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={processInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.58, ease: "easeOut" }}
          >
            <div className="bottle-shadow" />
            <img src="/assets/nobg_soda.png" alt="" />
            <span className="orbit orbit-one" /><span className="orbit orbit-two" />
          </motion.div>
          <div className="process-steps">
            <div className="steps">
              {[{
                num: "01",
                title: "Submit your request",
                desc: "Share business details and select flavours and case quantities."
              }, {
                num: "02",
                title: "We call and confirm",
                desc: "Our team confirms availability, negotiated pricing, and delivery details."
              }, {
                num: "03",
                title: "Track fulfilment",
                desc: "Use your private quote number and email to follow each stage."
              }].map(({ num, title, desc }, index) => (
                <motion.div
                  key={num}
                  initial={{ opacity: 0.05, x: 45 }}
                  animate={processInView ? { opacity: 1, x: 0 } : { opacity: 0.05, x: 45 }}
                  transition={{
                    type: "tween",
                    ease: "easeOut",
                    duration: 1.0,
                    delay: processInView ? index * 0.9 : 0,
                  }}
                >
                  <b>{num}</b>
                  <span>
                    <strong>{title}</strong>
                    <small>{desc}</small>
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="conversion-cta" id="quote">
        <div className="banner-content">
          <span>WHOLESALE ENQUIRIES</span>
          <h2>Request a business quote.</h2>
          <p>Select your flavours and quantities. Our team will contact you to confirm availability and final pricing.</p>
          <div className="cta-actions"><a className="button primary large" href="/quote">Start Your Request</a><a className="button ghost large" href="/track">Track Existing Order</a></div>
        </div>
      </section>

      <footer className="footer-minimal">
        {/* Logo + brand name */}
        <div className="footer-min-brand">
          <img src="/assets/logo.png" alt="SodaSplash logo" />
          <span>SodaSplash</span>
        </div>

        {/* Copyright */}
        <p className="footer-min-copy">
          Copyright © 2026 SodaSplash. All rights reserved.
        </p>

        {/* Social icons */}
        <div className="footer-min-socials">
          {/* Facebook */}
          <a href="#" aria-label="Facebook" className="footer-social-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
          </a>
          {/* Instagram */}
          <a href="#" aria-label="Instagram" className="footer-social-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
          </a>
          {/* LinkedIn */}
          <a href="#" aria-label="LinkedIn" className="footer-social-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
          </a>
          {/* Twitter / X */}
          <a href="#" aria-label="Twitter" className="footer-social-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/></svg>
          </a>
          {/* WhatsApp */}
          <a href="#" aria-label="WhatsApp" className="footer-social-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
          </a>
        </div>

      </footer>
    </main>
  );
}
