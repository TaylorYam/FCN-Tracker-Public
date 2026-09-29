import type { NextConfig } from "next";

const LOCALE_COOKIE = "NEXT_LOCALE";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async redirects() {
    return [
      // "/" → the visitor's language: remembered choice first, then the
      // browser's primary language, then English.
      {
        source: "/",
        has: [{ type: "cookie", key: LOCALE_COOKIE, value: "zh-TW" }],
        destination: "/zh-TW",
        permanent: false,
      },
      {
        source: "/",
        has: [{ type: "cookie", key: LOCALE_COOKIE, value: "en" }],
        destination: "/en",
        permanent: false,
      },
      {
        source: "/",
        has: [{ type: "header", key: "accept-language", value: "zh.*" }],
        destination: "/zh-TW",
        permanent: false,
      },
      { source: "/", destination: "/en", permanent: false },
      // Links from before the site was localized.
      { source: "/products/:productId", destination: "/en/products/:productId", permanent: false },
    ];
  },
};

export default nextConfig;
