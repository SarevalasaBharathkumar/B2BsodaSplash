"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { defaultProducts, formatINR, type PublicProduct } from "@/lib/flavours";

export default function FlavourReveal() {
  const [products, setProducts] = useState<PublicProduct[]>(defaultProducts);
  const [activeProductId, setActiveProductId] = useState(defaultProducts[0]?.id ?? "");
  const activeProduct = products.find((product) => product.id === activeProductId) ?? products[0];

  useEffect(() => {
    fetch("/api/products")
      .then((response) => response.json())
      .then((data) => {
        if (!data.products?.length) return;
        setProducts(data.products);
        setActiveProductId(data.products[0].id);
      })
      .catch(() => undefined);
  }, []);

  return (
    <section className="flavours section" id="flavours">
      <div className="section-kicker"><span /> FLAVOURS & PRICING</div>
      <div className="section-heading"><h2>Choose product, then flavour.</h2><p>Open a product to see available active flavours and current case pricing from the admin catalog.</p></div>
      <div className="product-picker" role="tablist" aria-label="Product catalog">
        {products.map((product) => (
          <button
            type="button"
            className={`product-card ${activeProduct?.id === product.id ? "active" : ""}`}
            onClick={() => setActiveProductId(product.id)}
            key={product.id}
            role="tab"
            aria-selected={activeProduct?.id === product.id}
          >
            {product.image_url && <img className="product-card-image" src={product.image_url} alt="" />}
            <span>{product.name}</span>
            <strong>{product.flavours.length} flavours</strong>
            <small>{product.description || "Flavours managed by admin"}</small>
          </button>
        ))}
      </div>
      <motion.div
        className="flavour-grid"
        key={activeProduct?.id}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: .3 }}
      >
        {activeProduct?.flavours.map((flavour, index) => (
          <motion.article className="flavour-card" key={flavour.id} initial={{ opacity: 0, y: 24, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: index * .05, duration: .35 }} style={{ "--flavour": flavour.color } as React.CSSProperties}>
            <div className="flavour-top"><span>{String(index + 1).padStart(2, "0")}</span></div>
            <div className="flavour-orb"><span /><span /></div>
            <div className="flavour-info"><h3>{flavour.name}</h3><p>{flavour.note}</p><div><strong>{formatINR(flavour.price_per_case)}</strong><small>/ CASE</small></div></div>
          </motion.article>
        ))}
        {!activeProduct?.flavours.length && <p className="empty-product">No active flavours for this product yet.</p>}
      </motion.div>
      <div className="price-note">Minimum order: 1 case per flavour <i /> Final pricing is confirmed after our call <i /> No online payment required</div>
      <div className="section-action"><a className="button primary" href="/quote">Select flavours and request quote</a></div>
    </section>
  );
}
