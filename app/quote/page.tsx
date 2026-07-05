import QuoteRequestForm from "@/components/quote/QuoteRequestForm";

export const metadata = {
  title: "Request a Quote | SodaSplash"
};

export default function QuotePage() {
  return (
    <main className="portal-page">
      <header className="portal-nav">
        <a href="/"><img src="/assets/logo.png" alt="SodaSplash" /></a>
        <a href="/track">Track an order</a>
      </header>
      <section className="quote-page-section">
        <QuoteRequestForm />
      </section>
    </main>
  );
}
