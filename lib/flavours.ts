export type PublicFlavour = {
  id: string;
  product_id?: string | null;
  name: string;
  note: string;
  price_per_case: number;
  display_order: number;
  color: string;
};

export type PublicProduct = {
  id: string;
  name: string;
  description: string | null;
  image_url?: string | null;
  display_order: number;
  flavours: PublicFlavour[];
};

export const defaultProducts: PublicProduct[] = [
  {
    id: "goli-soda",
    name: "Goli Soda",
    description: "Classic marble soda bottles supplied by the case.",
    image_url: null,
    display_order: 1,
    flavours: [
      { id: "mango", product_id: "goli-soda", name: "Mango", note: "Ripe and tropical", price_per_case: 1200, display_order: 1, color: "#d49a3a" },
      { id: "lemon", product_id: "goli-soda", name: "Lemon", note: "Clean and citrus-forward", price_per_case: 1100, display_order: 2, color: "#b8b94b" },
      { id: "orange", product_id: "goli-soda", name: "Orange", note: "Bright and balanced", price_per_case: 1100, display_order: 3, color: "#cf7045" },
      { id: "mixed-berry", product_id: "goli-soda", name: "Mixed Berry", note: "Rich and fruit-led", price_per_case: 1300, display_order: 4, color: "#855b82" }
    ]
  },
  {
    id: "cup-soda",
    name: "Cup Soda",
    description: "Ready-to-serve cup format for counters and events.",
    image_url: null,
    display_order: 2,
    flavours: [
      { id: "cup-cola", product_id: "cup-soda", name: "Cola", note: "Familiar and fast moving", price_per_case: 900, display_order: 1, color: "#7b4f42" },
      { id: "cup-lime", product_id: "cup-soda", name: "Lime", note: "Sharp and refreshing", price_per_case: 850, display_order: 2, color: "#7aa957" }
    ]
  },
  {
    id: "more",
    name: "More",
    description: "Seasonal and custom flavours for larger requirements.",
    image_url: null,
    display_order: 3,
    flavours: [
      { id: "ginger", product_id: "more", name: "Ginger", note: "Warm and punchy", price_per_case: 1300, display_order: 1, color: "#b77742" },
      { id: "jeera", product_id: "more", name: "Jeera", note: "Spiced and savoury", price_per_case: 1250, display_order: 2, color: "#8d7650" }
    ]
  }
];

export const defaultFlavours: PublicFlavour[] = defaultProducts.flatMap((product) => product.flavours);

export function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value);
}
