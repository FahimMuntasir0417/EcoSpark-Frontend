import type { NextConfig } from "next";

const externalApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "");

function getExternalApiOrigin(apiBaseUrl: string | undefined) {
  if (!apiBaseUrl) {
    return null;
  }

  try {
    const url = new URL(apiBaseUrl);
    url.pathname = url.pathname.replace(/\/api\/v1\/?$/, "");
    url.search = "";
    url.hash = "";

    return url.toString().replace(/\/+$/, "");
  } catch {
    return null;
  }
}

const externalApiOrigin = getExternalApiOrigin(externalApiBaseUrl);

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.102"],
  async rewrites() {
    if (!externalApiBaseUrl) {
      return [];
    }

    const apiRewrites = [
      {
        source: "/api/v1/:path*",
        destination: `${externalApiBaseUrl}/:path*`,
      },
    ];

    if (externalApiOrigin) {
      apiRewrites.push({
        source: "/api/auth/:path*",
        destination: `${externalApiOrigin}/api/auth/:path*`,
      });
    }

    return apiRewrites;
  },
};

export default nextConfig;
