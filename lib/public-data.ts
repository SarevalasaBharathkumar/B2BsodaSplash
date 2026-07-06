import { unstable_cache } from "next/cache";
import { createSupabaseAdminClient, hasSupabaseAdminEnv } from "./supabase";
import { defaultFlavours, defaultProducts, type PublicFlavour, type PublicProduct } from "./flavours";

type ProductRow = {
  id: string;
  name: string;
  description: string | null;
  image_url?: string | null;
  display_order: number | null;
};

type TeamMember = {
  id: string;
  name: string;
};

async function loadCatalogFromSupabase() {
  const supabase = createSupabaseAdminClient();

  const { data: products, error: productError } = await supabase
    .from("products")
    .select("id,name,description,image_url,display_order")
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (productError) {
    throw productError;
  }

  const productRows = (products ?? []) as ProductRow[];
  if (!productRows.length) {
    return [] as PublicProduct[];
  }

  const { data: flavours, error: flavourError } = await supabase
    .from("flavours")
    .select("id,product_id,name,note,price_per_case,display_order,color")
    .in("product_id", productRows.map((product) => product.id))
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (flavourError) {
    throw flavourError;
  }

  const flavoursByProduct = new Map<string, PublicFlavour[]>();
  for (const flavour of (flavours ?? []) as PublicFlavour[]) {
    if (!flavour.product_id) continue;
    flavoursByProduct.set(flavour.product_id, [...(flavoursByProduct.get(flavour.product_id) ?? []), flavour]);
  }

  return productRows.map((product) => {
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
}

export async function loadPublicProducts() {
  if (!hasSupabaseAdminEnv) {
    return defaultProducts;
  }

  try {
    const catalog = await getCachedPublicProducts();
    return catalog.length ? catalog : defaultProducts;
  } catch {
    return defaultProducts;
  }
}

export async function loadPublicFlavours() {
  const products = await loadPublicProducts();
  return products.flatMap((product) => product.flavours);
}

export async function loadPublicTeam() {
  if (!hasSupabaseAdminEnv) {
    return [] as TeamMember[];
  }

  try {
    return await getCachedPublicTeam();
  } catch {
    return [] as TeamMember[];
  }
}

const getCachedPublicProducts = unstable_cache(
  async () => {
    const catalog = await loadCatalogFromSupabase();
    return catalog.length ? catalog : defaultProducts;
  },
  ["public-products"],
  {
    revalidate: 60,
    tags: ["public-catalog"]
  }
);

const getCachedPublicTeam = unstable_cache(
  async () => {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("id,full_name,email")
      .eq("role", "bd")
      .eq("is_active", true)
      .order("full_name", { ascending: true });

    if (error) {
      return [] as TeamMember[];
    }

    return (data ?? []).map((member) => ({
      id: member.id,
      name: member.full_name || member.email
    }));
  },
  ["public-team"],
  {
    revalidate: 60,
    tags: ["public-team"]
  }
);
