import { NextResponse } from "next/server";
import { loadPublicTeam } from "@/lib/public-data";

export const revalidate = 60;

export async function GET() {
  const team = await loadPublicTeam();
  return NextResponse.json(
    { team },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300"
      }
    }
  );
}
