import { NextResponse } from "next/server";
import { createSupabaseAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase";
import { defaultProducts, type PublicFlavour, type PublicProduct } from "@/lib/flavours";

export const revalidate = 60;

type ProductRow = {
  id: string;
  name: string;
  description: string | null;
  image_url?: string | null;
  display_order: number | null;
};

function isMissingProductCatalogColumn(error: { message?: string } | null) {
  const message = error?.message || "";
  return message.includes("products.display_order");
}

export async function GET() {
  if (!hasSupabaseAdminEnv) {
    return NextResponse.json({ products: defaultProducts, source: "fallback" });
  }

  const supabase = createSupabaseAdminClient();
  let { data: products, error: productError } = await supabase
    .from("products")
    .select("id,name,description,image_url,display_order")
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (isMissingProductCatalogColumn(productError)) {
    const fallback = await supabase
      .from("products")
      .select("id,name,description,image_url")
      .eq("is_active", true)
      .order("created_at", { ascending: true });

    products = fallback.data?.map((product, index) => ({
      ...product,
      display_order: index + 1
    })) ?? null;
    productError = fallback.error;
  }

  if (productError) {
    return NextResponse.json({ error: productError.message }, { status: 500 });
  }

  const productRows = (products ?? []) as ProductRow[];
  if (!productRows.length) {
    return NextResponse.json({ products: [], source: "supabase" });
  }

  const { data: flavours, error: flavourError } = await supabase
    .from("flavours")
    .select("id,product_id,name,note,price_per_case,display_order,color")
    .in("product_id", productRows.map((product) => product.id))
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (flavourError) {
    return NextResponse.json({ error: flavourError.message }, { status: 500 });
  }

  const flavoursByProduct = new Map<string, PublicFlavour[]>();
  for (const flavour of (flavours ?? []) as PublicFlavour[]) {
    if (!flavour.product_id) continue;
    flavoursByProduct.set(flavour.product_id, [...(flavoursByProduct.get(flavour.product_id) ?? []), flavour]);
  }

  const catalog: PublicProduct[] = productRows.map((product) => {
    const productFlavours = flavoursByProduct.get(product.id) ?? [];

    return {
      id: product.id,
      name: product.name === "SodaSplash" ? "Goli Soda" : product.name,
      description: product.name === "SodaSplash" ? "Classic marble soda bottles supplied by the case." : product.description,
      image_url: product.image_url ?? null,
      display_order: product.display_order ?? 0,
      flavours: productFlavours
    };
  });

  return NextResponse.json({ products: catalog, source: "supabase" });
}
