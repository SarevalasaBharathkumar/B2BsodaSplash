import { NextResponse } from "next/server";
import { loadPublicProducts } from "@/lib/public-data";

export const revalidate = 60;

export async function GET() {
  const products = await loadPublicProducts();
  return NextResponse.json(
    { products, source: products.length ? "supabase" : "fallback" },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300"
      }
    }
  );
}
