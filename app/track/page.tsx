import TrackingForm from "@/components/quote/TrackingForm";

export const metadata = {
  title: "Track Order | SodaSplash"
};

export default function TrackPage({
  searchParams
}: {
  searchParams: { quote?: string; email?: string };
}) {
  return (
    <main className="portal-page">
      <header className="portal-nav">
        <a href="/"><img src="/assets/logo.png" alt="SodaSplash" /></a>
        <a href="/quote">Request a quote</a>
      </header>
      <section className="tracking-page">
        <TrackingForm initialQuote={searchParams.quote} initialEmail={searchParams.email} />
      </section>
    </main>
  );
}
