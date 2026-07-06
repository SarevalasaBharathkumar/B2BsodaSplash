import { NextResponse } from "next/server";
import { loadPublicFlavours } from "@/lib/public-data";

export const revalidate = 60;

export async function GET() {
  const flavours = await loadPublicFlavours();
  return NextResponse.json(
    { flavours, source: flavours.length ? "supabase" : "fallback" },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300"
      }
    }
  );
}
