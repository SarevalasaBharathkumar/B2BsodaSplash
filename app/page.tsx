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

export default function Home() {
  return (
    <main>
      <Hero3D />
      <FlavourReveal />

      <section className="serve section" id="customers">
        <div className="section-kicker"><span /> MADE FOR BUSINESS</div>
        <div className="section-heading split-heading">
          <h2>Built for business.</h2>
          <p>SodaSplash serves businesses that need clear case pricing, multiple flavour options, and a straightforward ordering process.</p>
        </div>
        <div className="serve-grid">
          {customers.map(({ title, text, image, tag }) => (
            <article className="serve-card" key={title}>
              <div className="serve-card-image">
                <img src={image} alt={title} />
                <span className="serve-card-tag">{tag}</span>
              </div>
              <div className="serve-card-body">
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="process section" id="process">
        <div className="process-art" aria-hidden="true">
          <div className="bottle-shadow" />
          <img src="/assets/nobg_soda.png" alt="" />
          <span className="orbit orbit-one" /><span className="orbit orbit-two" />
        </div>
        <div className="process-copy">
          <div className="section-kicker light"><span /> SIMPLE BY DESIGN</div>
          <h2>How ordering works.</h2>
          <div className="steps">
            <div><b>01</b><span><strong>Submit your request</strong><small>Share business details and select flavours and case quantities.</small></span></div>
            <div><b>02</b><span><strong>We call and confirm</strong><small>Our team confirms availability, negotiated pricing, and delivery details.</small></span></div>
            <div><b>03</b><span><strong>Track fulfilment</strong><small>Use your private quote number and email to follow each stage.</small></span></div>
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

      <footer>
        <div className="footer-brand">
          <img src="/assets/logo.png" alt="SodaSplash" />
          <p>Wholesale flavoured goli soda for businesses across India.</p>
        </div>
        <div className="footer-links"><span>EXPLORE</span><a href="#flavours">Flavours</a><a href="#customers">Who we serve</a><a href="#process">How it works</a></div>
        <div className="footer-links"><span>ENQUIRIES</span><a href="/quote">Request a quote</a><a href="/track">Track your order</a></div>
        <div className="footer-contact"><span>SUPPLY</span><p>India · Wholesale orders only</p><p>No online payment required</p><a className="staff-link" href="/login">Staff Login</a></div>
        <div className="footer-bottom"><small>© 2026 SodaSplash</small><small>Wholesale beverage supply</small></div>
      </footer>
    </main>
  );
}
