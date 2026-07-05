export const siteConfig = {
  name: "SodaSplash",
  founderEmail: "founder@sodasplash.me",
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@sodasplash.me",
  supportPhone: process.env.NEXT_PUBLIC_SUPPORT_PHONE || "Add phone number",
  domain: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  minimumCasesPerFlavour: 1
};

export const orderStages = [
  "submitted",
  "contacted",
  "negotiating",
  "confirmed",
  "ready",
  "shipped",
  "delivered"
] as const;

export type OrderStage = (typeof orderStages)[number] | "cancelled";

export const stageLabels: Record<OrderStage, string> = {
  submitted: "Submitted",
  contacted: "Contacted",
  negotiating: "Negotiating",
  confirmed: "Confirmed",
  ready: "Ready",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled"
};

export function getNextStage(status: OrderStage) {
  if (status === "cancelled") return null;
  const index = orderStages.indexOf(status as (typeof orderStages)[number]);
  return index >= 0 && index < orderStages.length - 1 ? orderStages[index + 1] : null;
}
