import OrderEditor from "@/components/quote/OrderEditor";

export const metadata = {
  title: "Edit Order | SodaSplash"
};

export default function OrderPage({ params }: { params: { quoteNumber: string } }) {
  return (
    <main className="portal-page">
      <header className="portal-nav">
        <a href="/"><img src="/assets/logo.png" alt="SodaSplash" /></a>
        <a href="/admin">Dashboard</a>
      </header>
      <section className="quote-page-section">
        <OrderEditor quoteNumber={params.quoteNumber} />
      </section>
    </main>
  );
}
