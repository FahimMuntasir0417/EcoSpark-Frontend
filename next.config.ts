import type { NextConfig } from "next";

const externalApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "");

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.102"],
  async rewrites() {
    if (!externalApiBaseUrl) {
      return [];
    }

    return [
      {
        source: "/api/v1/:path*",
        destination: `${externalApiBaseUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
