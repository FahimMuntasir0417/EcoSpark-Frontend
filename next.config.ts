import type { NextConfig } from "next";

const externalApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "");

const nextConfig: NextConfig = {
  // Keep generated artifacts out of `.next`, which is more prone to file locks on Windows.
  distDir: ".dist",
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
