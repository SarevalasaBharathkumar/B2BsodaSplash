import dynamic from "next/dynamic";
import HeroFallback from "./HeroFallback";
import Image from "next/image";

// Load the Three.js canvas only on the client — never SSR
const BottleCanvas = dynamic(() => import("./BottleCanvas"), {
  ssr: false,
  loading: () => null,
});

export default function Hero3D() {
  return (
    <section className="hero" id="top" suppressHydrationWarning>
      {/* Nav sits on top */}
      <nav suppressHydrationWarning>
        <a className="nav-logo" href="#top">
          <Image
            src="/assets/logo.png"
            alt="SodaSplash logo"
            width={72}
            height={72}
            priority
          />
        </a>
        <div className="nav-links">
          <a href="#flavours">Flavours</a>
          <a href="#customers">For Business</a>
          <a href="#process">How it works</a>
        </div>
        <a className="track-link" href="/track">Track Order</a>
      </nav>

      {/* Hero layout grid */}
      <div className="hero-grid">
        <div className="hero-copy">
          <div className="eyebrow"><i /> WHOLESALE GOLI SODA <i /></div>
          <h1>
            <span className="hero-title-desktop">Refreshment, made<br />for business.</span>
            <span className="hero-title-mobile">Refreshment, made<br />for business.</span>
          </h1>
          <p>
            Flavoured goli soda supplied by the case for hotels, restaurants,
            retailers, offices, cinemas, and events.
          </p>
          <div className="hero-actions">
            <a className="button primary" href="/quote">Request a Quote</a>
            <a className="button ghost" href="#flavours">View Flavours</a>
          </div>
          <div className="hero-trust">
            <span><i className="trust-dot" />Case pricing</span>
            <span><i className="trust-dot" />No online payment</span>
          </div>
        </div>

        {/* 3D bottle viewport centered on the right side */}
        <div className="hero-visual hero-visual-shell">
          <HeroFallback />
          <div className="hero-visual-canvas">
            <BottleCanvas />
          </div>
        </div>
      </div>
    </section>
  );
}
