import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "About Us",
  description: "Inspired by the timeless love for traditional Indian sodas, SodaSplash provides B2B wholesale goli soda cases for modern businesses, hotels, and restaurants.",
  alternates: {
    canonical: "/about",
  },
};

export default function AboutPage() {
  return (
    <main className="portal-page" id="top">
      {/* Navbar matching Hero3D header exactly */}
      <nav className="nav" style={{ width: "100%", zIndex: 100 }} suppressHydrationWarning>
        <a href="/" className="nav-logo">
          <Image
            src="/assets/logo.png"
            alt="SodaSplash logo"
            width={72}
            height={72}
            priority
          />
        </a>
        <div className="nav-links">
          <a href="/#customers">For Business</a>
          <a href="/#process">How it works</a>
          <a href="/about" style={{ opacity: 1, borderBottom: "1px solid var(--fizz)", paddingBottom: "5px" }}>About Us</a>
        </div>
        <a className="track-link" href="/track">Track Order</a>
      </nav>

      {/* Main Section */}
      <div className="quote-shell" style={{ padding: "56px 20px 90px" }}>
        
        {/* Hero Section */}
        <section style={{ textAlign: "center", marginBottom: "72px" }}>
          <span style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.18em", color: "var(--splash)", textTransform: "uppercase" }}>
            ABOUT SODASPLASH
          </span>
          <h1 style={{ fontSize: "clamp(2.4rem, 5vw, 4.5rem)", color: "var(--cream)", margin: "16px 0 24px", lineHeight: 0.9 }}>
            Nostalgic Flavours.<br />Modern Commercial Supply.
          </h1>
          <p style={{ maxWidth: "800px", margin: "0 auto", color: "#91aabd", lineHeight: 1.75, fontSize: "16px" }}>
            At SodaSplash, we believe that business refreshments shouldn't be a hassle.
          </p>
          <p style={{ maxWidth: "800px", margin: "20px auto 0", color: "#c5d3d9", lineHeight: 1.8, fontSize: "16px" }}>
            Inspired by the timeless love for traditional Indian sodas, we have reimagined nostalgic flavours into a premium, ready-to-serve beverage solution built exclusively for modern businesses. We bridge the gap between nostalgic regional tastes and streamlined commercial logistics, helping hospitality, retail, and entertainment venues treat their customers while protecting their bottom line.
          </p>
          <div style={{ fontStyle: "italic", margin: "32px auto 0", color: "var(--splash)", fontSize: "17px", fontWeight: 500, maxWidth: "680px" }}>
            "Our mission is simple: To deliver high-quality, perfectly carbonated wholesale sodas that delight customers and maximize business margins."
          </div>
        </section>

        {/* Two-Column Grid: Problem & Features */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "32px", marginBottom: "80px" }}>
          
          {/* Card 1: Problem We Solve */}
          <article className="glass-card" style={{ padding: "40px 32px", border: "1px solid rgba(143,232,245,0.12)", height: "auto", position: "relative" }}>
            <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.15em", color: "var(--coral)", textTransform: "uppercase" }}>THE LOGISTICS CHALLENGE</span>
            <h2 style={{ fontSize: "28px", color: "var(--cream)", marginTop: "12px", marginBottom: "16px" }}>The Problem We Solve</h2>
            <p style={{ color: "#91aabd", lineHeight: 1.7, fontSize: "14px" }}>
              For years, serving classic local sodas meant dealing with unpredictable quality, messy open-market logistics, or complicated DIY carbonation setups that waste valuable staff time.
            </p>
            <p style={{ color: "#c5d3d9", lineHeight: 1.7, fontSize: "14px", marginTop: "16px" }}>
              SodaSplash eliminates the guesswork. We manufacture and deliver fully prepared, case-based supplies straight to your venue.
            </p>
            <div style={{ marginTop: "24px", padding: "16px", background: "rgba(6, 23, 34, 0.5)", borderRadius: "4px", borderLeft: "3px solid var(--fizz)" }}>
              <p style={{ color: "white", fontSize: "13px", fontWeight: 600, margin: 0 }}>
                No expensive machinery. · No manual syrup mixing. · No flat drinks.
              </p>
              <p style={{ color: "#91aabd", fontSize: "12px", margin: "8px 0 0" }}>
                Your team simply opens a case, chills, and serves a perfect drink every single time.
              </p>
            </div>
          </article>

          {/* Card 2: Engineered for Commercial Success */}
          <article className="glass-card" style={{ padding: "40px 32px", border: "1px solid rgba(143,232,245,0.12)", height: "auto" }}>
            <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.15em", color: "var(--fizz)", textTransform: "uppercase" }}>COMMERCIAL DESIGN</span>
            <h2 style={{ fontSize: "28px", color: "var(--cream)", marginTop: "12px", marginBottom: "20px" }}>Engineered for Success</h2>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <strong style={{ color: "var(--cream)", fontSize: "16px", display: "block" }}>Transparent Case Pricing</strong>
                <small style={{ color: "#91aabd", fontSize: "13px", display: "block", marginTop: "4px", lineHeight: 1.5 }}>
                  No hidden fees. Clear wholesale rates from ₹1,100 to ₹1,300 per case so you can plan your margins accurately.
                </small>
              </div>
              <div style={{ borderTop: "1px solid rgba(143, 232, 245, 0.08)", paddingTop: "16px" }}>
                <strong style={{ color: "var(--cream)", fontSize: "16px", display: "block" }}>Streamlined Digital B2B Workflow</strong>
                <small style={{ color: "#91aabd", fontSize: "13px", display: "block", marginTop: "4px", lineHeight: 1.5 }}>
                  Skip the endless phone tags. Select your varieties online, Request a Quote, and monitor your shipment in real time using our Track Order portal.
                </small>
              </div>
              <div style={{ borderTop: "1px solid rgba(143, 232, 245, 0.08)", paddingTop: "16px" }}>
                <strong style={{ color: "var(--cream)", fontSize: "16px", display: "block" }}>Flexible Quantity Fulfillment</strong>
                <small style={{ color: "#91aabd", fontSize: "13px", display: "block", marginTop: "4px", lineHeight: 1.5 }}>
                  Whether you need a steady supply for regular restaurant service or a custom volume batch for a major corporate event, our distribution network delivers.
                </small>
              </div>
            </div>
          </article>

        </div>

        {/* Bottom CTA Card: Partner With Us */}
        <section className="quote-success" style={{ padding: "56px 24px", background: "linear-gradient(135deg, #092333 0%, #061824 100%)", borderRadius: "8px" }}>
          <span style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.18em", color: "var(--splash)", textTransform: "uppercase" }}>
            PARTNER WITH US
          </span>
          <h2 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", color: "var(--cream)", margin: "12px 0 20px" }}>
            Ready to elevate your beverage menu?
          </h2>
          <p style={{ maxWidth: "640px", margin: "0 auto 32px", color: "#9fb4bf", lineHeight: 1.6 }}>
            We don't just supply beverages; we help businesses build memorable customer experiences. From high-footfall cinemas to boutique hotels, we are proud to be the trusted B2B refreshment partner.
          </p>
          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            <a className="button primary" href="/quote">
              Build Your Full Quote
            </a>
            <a className="button ghost" href="/track">
              Track Existing Order
            </a>
          </div>
        </section>

      </div>

      {/* Footer minimal styled */}
      <footer className="footer-minimal" suppressHydrationWarning>
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
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
            </svg>
          </a>
          <a href="https://www.linkedin.com/company/sodaspalsh/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="footer-social-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
              <rect x="2" y="9" width="4" height="12"/>
              <circle cx="4" cy="4" r="2"/>
            </svg>
          </a>
          <a href="mailto:noreply@sodasplash.me" aria-label="Email" className="footer-social-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
          </a>
          <a href="#top" aria-label="Scroll to top" className="footer-social-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="19" x2="12" y2="5"></line>
              <polyline points="5 12 12 5 19 12"></polyline>
            </svg>
          </a>
        </div>
      </footer>
    </main>
  );
}
