"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { defaultProducts, formatINR, type PublicProduct } from "@/lib/flavours";

// Fruit emoji map — gracefully falls back to a coloured circle
const FLAVOUR_EMOJI: Record<string, string> = {
  mango: "🥭",
  lemon: "🍋",
  orange: "🍊",
  "mixed-berry": "🫐",
  "cup-cola": "🥤",
  "cup-lime": "🍃",
  ginger: "🫚",
  jeera: "🌿",
};

function getFlavourEmoji(id: string, name: string): string {
  const key = id.toLowerCase().replace(/\s+/g, "-");
  if (FLAVOUR_EMOJI[key]) return FLAVOUR_EMOJI[key];
  const nameLower = name.toLowerCase();
  for (const [k, v] of Object.entries(FLAVOUR_EMOJI)) {
    if (nameLower.includes(k)) return v;
  }
  return "✨";
}

export default function FlavourReveal() {
  const [products, setProducts] = useState<PublicProduct[]>(defaultProducts);
  const [activeProductId, setActiveProductId] = useState(defaultProducts[0]?.id ?? "");
  const [loading, setLoading] = useState(true);

  const activeProduct = products.find((p) => p.id === activeProductId) ?? products[0];

  // Fetch live data from backend — falls back to defaultProducts on error
  useEffect(() => {
    setLoading(true);
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (data.products?.length) {
          setProducts(data.products);
          setActiveProductId(data.products[0].id);
        }
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="flavours section" id="flavours">
      {/* Section header */}
      <div className="section-kicker"><span /> FLAVOURS &amp; PRICING</div>
      <div className="section-heading">
        <h2>Pick your flavour.</h2>
        <p>
          Case pricing updated live from our catalog. Select a product line,
          choose your flavours, and submit a wholesale quote request.
        </p>
      </div>

      {/* Product switcher — pill tabs */}
      <div className="product-tabs" role="tablist" aria-label="Product lines">
        {products.map((product) => (
          <button
            key={product.id}
            type="button"
            role="tab"
            aria-selected={activeProduct?.id === product.id}
            className={`product-tab ${activeProduct?.id === product.id ? "active" : ""}`}
            onClick={() => setActiveProductId(product.id)}
          >
            {product.name}
            <span className="tab-count">{product.flavours.length}</span>
          </button>
        ))}
      </div>

      {/* Glassmorphism flavour card grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeProduct?.id}
          className="glass-grid"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.32 }}
        >
          {activeProduct?.flavours.map((flavour, index) => (
            <motion.article
              className="glass-card"
              key={flavour.id}
              style={{ "--flavour": flavour.color } as React.CSSProperties}
              initial={{ opacity: 0, y: 32, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: index * 0.07, duration: 0.38, ease: [0.25, 0.46, 0.45, 0.94] }}
              whileHover={{ y: -10, transition: { duration: 0.25 } }}
            >
              {/* Colour accent bar */}
              <div className="glass-card__accent" />

              {/* Fruit icon */}
              <div className="glass-card__icon" aria-hidden="true">
                {getFlavourEmoji(flavour.id, flavour.name)}
              </div>

              {/* Name + tasting note */}
              <div className="glass-card__body">
                <h3 className="glass-card__name">{flavour.name}</h3>
                <p className="glass-card__note">{flavour.note}</p>
              </div>

              {/* Price badge */}
              <div className="glass-card__price-badge">
                <strong>{formatINR(flavour.price_per_case)}</strong>
                <span>/ CASE</span>
              </div>

              {/* MOQ line */}
              <p className="glass-card__moq">Min. 1 case &nbsp;·&nbsp; No online payment</p>

              {/* Add to Quote CTA */}
              <a
                className="glass-card__cta"
                href={`/quote?flavour=${encodeURIComponent(flavour.id)}&product=${encodeURIComponent(activeProduct.id)}`}
                aria-label={`Add ${flavour.name} to quote`}
              >
                Add to Quote <span className="cta-arrow">→</span>
              </a>
            </motion.article>
          ))}

          {!activeProduct?.flavours.length && (
            <p className="glass-empty">No active flavours in this product line yet.</p>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Footer note */}
      <div className="price-note">
        Prices updated live from admin catalog
        <i />
        Final pricing confirmed after our call
        <i />
        Minimum 1 case per flavour
      </div>

      <div className="section-action">
        <a className="button primary large" href="/quote">
          Build your full quote →
        </a>
      </div>
    </section>
  );
}
