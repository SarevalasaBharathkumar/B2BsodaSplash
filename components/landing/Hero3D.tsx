export default function Hero3D() {
  return (
    <section className="hero" id="top">
      <nav>
        <a className="nav-logo" href="#top"><img src="/assets/logo.png" alt="SodaSplash" /></a>
        <div className="nav-links"><a href="#flavours">Flavours</a><a href="#customers">For Business</a><a href="#process">How it works</a></div>
        <a className="track-link" href="/track">Track Order</a>
      </nav>

      <div className="hero-grid">
        <div className="hero-copy">
          <div className="eyebrow"><i /> WHOLESALE GOLI SODA <i /></div>
          <h1>Refreshment,<br />made for business.</h1>
          <p>Flavoured goli soda supplied by the case for hotels, restaurants, retailers, offices, cinemas, and events.</p>
          <div className="hero-actions"><a className="button primary" href="/quote">Request a Quote</a><a className="button ghost" href="#flavours">View Flavours</a></div>
        </div>
        <div className="hero-visual">
          <div className="halo" />
          <img src="/assets/nobg_soda.png" alt="Blue goli soda bottle bursting through sparkling water" />
        </div>
      </div>
    </section>
  );
}
