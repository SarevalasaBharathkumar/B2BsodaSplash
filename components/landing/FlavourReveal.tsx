"use client";

import { motion, AnimatePresence, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
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

// Get pile offsets — cards start stacked at center, fan out to grid
function getPileOffset(index: number, isMobile: boolean) {
  if (isMobile) {
    const xOffsets = ["40%", "-40%", "40%", "-40%", "40%", "-40%", "40%", "-40%"];
    const rotates  = [-6, 6, -4, 4, -6, 6, -4, 4];
    return { x: xOffsets[index % 8] ?? 0, y: 60, rotate: rotates[index % 8] ?? 0 };
  } else {
    const cols = 4;
    const col  = index % cols;
    // fan from center: columns 0,1,2,3 → shift -150%, -50%, 50%, 150%
    const xShifts = ["-150%", "-50%", "50%", "150%"];
    return { x: xShifts[col] ?? 0, y: 10, rotate: (col - 1.5) * 5 };
  }
}

export default function FlavourReveal({ initialProducts }: { initialProducts?: PublicProduct[] }) {
  const [products, setProducts] = useState<PublicProduct[]>(initialProducts ?? defaultProducts);
  const [activeProductId, setActiveProductId] = useState((initialProducts ?? defaultProducts)[0]?.id ?? "");
  const [loading, setLoading] = useState(!initialProducts?.length);
  const [isMobile, setIsMobile]         = useState(false);
  // mounted guard: ensures cards always start from pile position on cold server load
  const [mounted, setMounted]           = useState(false);

  const sectionRef = useRef<HTMLElement>(null);
  // `amount: 0.05` — section is "in view" as soon as 5 % of it enters the viewport
  const isInViewRaw = useInView(sectionRef, { amount: 0.05 });
  // Only trust isInView after client has hydrated — prevents skipped animation on first load
  const isInView    = mounted && isInViewRaw;

  const activeProduct = products.find((p) => p.id === activeProductId) ?? products[0];

  useEffect(() => {
    // Mark as mounted after first client paint so initial pile position is committed
    setMounted(true);
  }, []);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 760);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (initialProducts?.length) {
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch("/api/products")
      .then((r) => r.json())
      .then((d) => {
        if (d.products?.length) {
          setProducts(d.products);
          setActiveProductId(d.products[0].id);
        }
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [initialProducts]);

  return (
    <section className="flavours section" id="flavours" ref={sectionRef}>
      {/* Section header */}
      <div className="section-kicker"><span /> FLAVOURS &amp; PRICING</div>
      <div className="section-heading">
        <h2>Pick your flavour.</h2>
        <p>Select a product line, choose your flavours, and submit a wholesale quote request.</p>
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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          {activeProduct?.flavours.map((flavour, index) => {
            const pile  = getPileOffset(index, isMobile);
            // When section is in view: animate to natural grid position.
            // When out of view: return to pile.
            // Opacity is kept at 1 always — only x/y/rotate/scale animate.
            return (
              <motion.article
                className="glass-card"
                key={flavour.id}
                style={{ "--flavour": flavour.color } as React.CSSProperties}
                initial={{ x: pile.x, y: pile.y, rotate: pile.rotate, scale: 0.88 }}
                animate={
                  isInView
                    ? { x: 0, y: 0, rotate: 0, scale: 1 }
                    : { x: pile.x, y: pile.y, rotate: pile.rotate, scale: 0.88 }
                }
                transition={{
                  type: "spring",
                  stiffness: 120,
                  damping: 12,
                  delay: isInView ? index * 0.06 : 0,
                }}
                whileHover={{ y: -8, scale: 1.02, zIndex: 5, transition: { duration: 0.2 } }}
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
                {/* Add to Quote CTA */}
                <a
                  className="glass-card__cta"
                  href={`/quote?flavour=${encodeURIComponent(flavour.id)}&product=${encodeURIComponent(activeProduct.id)}`}
                  aria-label={`Add ${flavour.name} to quote`}
                >
                  Add to Quote <span className="cta-arrow">→</span>
                </a>
              </motion.article>
            );
          })}

          {!activeProduct?.flavours.length && (
            <p className="glass-empty">No active flavours in this product line yet.</p>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Footer note */}
      <div className="price-note">
        Minimum 1 case per flavour
        <i />
        Final pricing confirmed after our call
      </div>

      <div className="section-action">
        <a className="button primary large" href="/quote">
          Build your full quote →
        </a>
      </div>
    </section>
  );
}
