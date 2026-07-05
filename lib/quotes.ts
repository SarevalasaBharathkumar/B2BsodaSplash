import { orderStages, type OrderStage } from "./config";

export type QuoteItemInput = {
  flavourId: string;
  quantity: number;
};

export type QuoteRequestInput = {
  customerName: string;
  email: string;
  phone: string;
  businessName?: string;
  businessType: string;
  referralSource: string;
  referralName?: string;
  note?: string;
  items: QuoteItemInput[];
};

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function generateQuoteNumber() {
  const date = new Date();
  const stamp = [
    date.getFullYear().toString().slice(-2),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("");
  const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `SS-${stamp}-${suffix}`;
}

export function canAdvanceStatus(current: OrderStage, next: OrderStage) {
  if (current === "cancelled" || next === "cancelled") return next === "cancelled";
  const currentIndex = orderStages.indexOf(current as (typeof orderStages)[number]);
  const nextIndex = orderStages.indexOf(next as (typeof orderStages)[number]);
  return nextIndex === currentIndex + 1;
}

export function validateQuoteRequest(input: QuoteRequestInput) {
  const errors: string[] = [];

  if (!input.customerName?.trim()) errors.push("Name is required.");
  if (!input.email?.includes("@")) errors.push("Valid email is required.");
  if (!input.phone?.trim()) errors.push("Phone number is required.");
  if (!input.businessType?.trim()) errors.push("Business type is required.");
  if (!input.referralSource?.trim()) errors.push("Referral source is required.");

  const validItems = input.items.filter((item) => item.quantity > 0);
  if (!validItems.length) errors.push("Select at least one flavour.");

  return errors;
}
