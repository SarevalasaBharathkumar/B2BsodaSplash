/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  images: { formats: ["image/avif", "image/webp"] },
  async headers() {
    return [
      {
        source: "/assets/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable"
          },
          {
            key: "Expires",
            value: "Thu, 31 Dec 2037 23:55:55 GMT"
          }
        ]
      },
      {
        source: "/draco/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable"
          },
          {
            key: "Expires",
            value: "Thu, 31 Dec 2037 23:55:55 GMT"
          }
        ]
      },
      {
        source: "/favicon.png",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable"
          },
          {
            key: "Expires",
            value: "Thu, 31 Dec 2037 23:55:55 GMT"
          }
        ]
      },
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable"
          },
          {
            key: "Expires",
            value: "Thu, 31 Dec 2037 23:55:55 GMT"
          }
        ]
      }
    ];
  }
};

export default nextConfig;
