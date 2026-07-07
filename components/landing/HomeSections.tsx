"use client";

import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";

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

function getPileOffset(index: number, isMobile: boolean) {
  if (isMobile) {
    const xs = ["50%", "-50%", "50%", "-50%"];
    const ys = [80, 80, -80, -80];
    const rs = [-5, 5, -3, 3];
    return { x: xs[index] ?? 0, y: ys[index] ?? 0, rotate: rs[index] ?? 0 };
  }

  const xs = ["150%", "50%", "-50%", "-150%"];
  const ys = [15, 0, 0, 15];
  const rs = [-7, -2, 2, 7];
  return { x: xs[index] ?? 0, y: ys[index] ?? 0, rotate: rs[index] ?? 0 };
}

export default function HomeSections() {
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  const serveRef = useRef<HTMLElement>(null);
  const processRef = useRef<HTMLElement>(null);

  const serveInViewRaw = useInView(serveRef, { amount: 0.05 });
  const processInViewRaw = useInView(processRef, { amount: 0.1 });
  const serveInView = mounted && serveInViewRaw;
  const processInView = mounted && processInViewRaw;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1000);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <>
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
                initial={{ x: pile.x, y: pile.y, rotate: pile.rotate, scale: 0.88 }}
                animate={serveInView ? { x: 0, y: 0, rotate: 0, scale: 1 } : { x: pile.x, y: pile.y, rotate: pile.rotate, scale: 0.88 }}
                transition={{
                  type: "spring",
                  stiffness: 70,
                  damping: 14,
                  delay: serveInView ? index * 0.08 : 0,
                }}
              >
                <div className="serve-card-image" style={{ position: "relative" }}>
                  <Image
                    src={image}
                    alt={title}
                    fill
                    sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 25vw"
                    style={{ objectFit: "cover" }}
                  />
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
            <Image
              src="/assets/nobg_soda.png"
              alt="SodaSplash goli soda bottle showcase"
              width={380}
              height={500}
              style={{
                width: "76%",
                height: "83%",
                objectFit: "contain",
                mixBlendMode: "screen",
                position: "relative",
                zIndex: 2
              }}
            />
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
        <div className="footer-min-brand">
          <Image
            src="/assets/logo.png"
            alt="SodaSplash logo"
            width={46}
            height={46}
          />
          <span>SodaSplash</span>
        </div>

        <p className="footer-min-copy">
          Copyright © 2026 SodaSplash. All rights reserved.
        </p>

        <div className="footer-min-socials">
          <a href="https://www.instagram.com/sodasplash" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="footer-social-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
          </a>
          <a href="https://www.linkedin.com/company/sodaspalsh/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="footer-social-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
          </a>
          <a href="mailto:noreply@sodasplash.me" aria-label="Email" className="footer-social-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
          </a>
          <a href="#top" aria-label="Scroll to top" className="footer-social-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>
          </a>
        </div>
      </footer>
    </>
  );
}
