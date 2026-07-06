import Hero3D from "@/components/landing/Hero3D";
import FlavourReveal from "@/components/landing/FlavourReveal";
import HomeSections from "@/components/landing/HomeSections";
import { loadPublicProducts } from "@/lib/public-data";
import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

export default async function Home() {
  const products = await loadPublicProducts();

  // Create FAQ schema
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is the minimum case size for wholesale orders?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "The minimum order size is 1 case per selected flavour. Final pricing and logistics are confirmed during our verification call."
        }
      },
      {
        "@type": "Question",
        "name": "What is the process for placing a wholesale request?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "1. Submit your B2B request online by choosing your flavours and case quantities. 2. Our sales team will call you to confirm product availability and delivery scheduling. 3. Track order fulfillment using your private quote number and email."
        }
      },
      {
        "@type": "Question",
        "name": "Is online payment required when requesting a quote?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "No, online payment is not required at the time of submission. All transactions, special business rates, and payments are confirmed offline via our call."
        }
      }
    ]
  };

  // Create Product list schema
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "numberOfItems": products.length,
    "itemListElement": products.map((prod, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Product",
        "name": prod.name,
        "description": prod.description || "Classic premium marble soda bottles supplied by the case.",
        "brand": {
          "@type": "Brand",
          "name": "SodaSplash"
        },
        "offers": {
          "@type": "AggregateOffer",
          "priceCurrency": "INR",
          "priceSpecification": {
            "@type": "UnitPriceSpecification",
            "priceCurrency": "INR",
            "referenceQuantity": {
              "@type": "QuantitativeValue",
              "value": 1,
              "unitCode": "C62" // Case
            }
          }
        }
      }
    }))
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <main>
        <Hero3D />
        <FlavourReveal initialProducts={products} />
        <HomeSections />
      </main>
    </>
  );
}
