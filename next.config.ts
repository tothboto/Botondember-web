import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,

  images: {
    // Csak a saját képeinket optimalizálja a next/image (a /media route-ról).
    localPatterns: [{ pathname: "/media/**" }, { pathname: "/flags/**" }],
    qualities: [60, 75, 85],
  },

  async rewrites() {
    // A böngészők maguktól is keresik a /favicon.ico-t – ez mindig az aktív ikont adja.
    return [{ source: "/favicon.ico", destination: "/icons/current/favicon.ico" }];
  },

  async headers() {
    return [
      {
        // Alap biztonsági fejlécek minden oldalon.
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
        ],
      },
      {
        // A zászlók sosem változnak.
        source: "/flags/:file*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
