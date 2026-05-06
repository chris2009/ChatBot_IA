import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // En producción proxea /api/* al backend Railway
    if (process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_API_URL) {
      return [
        {
          source: "/api/:path*",
          destination: `${process.env.NEXT_PUBLIC_API_URL}/:path*`,
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
