import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/quote", "/track"],
        disallow: [
          "/admin",
          "/bd",
          "/login",
          "/orders",
          "/api"
        ],
      },
    ],
    sitemap: "https://sodasplash.me/sitemap.xml",
  };
}
