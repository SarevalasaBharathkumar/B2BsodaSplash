import QuoteRequestForm from "@/components/quote/QuoteRequestForm";
import { loadPublicProducts, loadPublicTeam } from "@/lib/public-data";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Request a Quote",
  description: "Request a wholesale B2B quote for SodaSplash cases. Choose mango, lemon, orange, and mixed berry goli soda flavours.",
  alternates: {
    canonical: "/quote",
  },
};

export default async function QuotePage() {
  const [products, team] = await Promise.all([loadPublicProducts(), loadPublicTeam()]);

  return (
    <main className="portal-page">
      <header className="portal-nav">
        <a href="/">
          <Image
            src="/assets/logo.png"
            alt="SodaSplash logo"
            width={62}
            height={62}
            priority
          />
        </a>
        <a href="/track">Track an order</a>
      </header>
      <section className="quote-page-section">
        <div className="quote-back-container">
          <a
            href="/"
            className="back-link-btn"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              color: "var(--splash)",
              fontSize: "13px",
              fontWeight: 700,
              textDecoration: "none",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              opacity: 0.85,
              transition: "opacity 0.2s"
            }}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            Back to Home
          </a>
        </div>
        <QuoteRequestForm initialProducts={products} initialTeam={team} />
      </section>
    </main>
  );
}
