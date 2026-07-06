import TrackingForm from "@/components/quote/TrackingForm";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Track Order",
  description: "Track the fulfillment status of your SodaSplash wholesale order or request details.",
  alternates: {
    canonical: "/track",
  },
};

export default function TrackPage({
  searchParams
}: {
  searchParams: { quote?: string; email?: string };
}) {
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
        <a href="/quote">Request a quote</a>
      </header>
      <section className="tracking-page">
        <div className="track-back-container">
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
        <TrackingForm initialQuote={searchParams.quote} initialEmail={searchParams.email} />
      </section>
    </main>
  );
}
