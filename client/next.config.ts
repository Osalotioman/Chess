import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const restBackendOrigin = process.env.REST_BACKEND_ORIGIN;
    const wsBackendOrigin = process.env.WS_BACKEND_ORIGIN;
    const wsBackendPath = process.env.WS_BACKEND_PATH || "/";

    const rewrites: Array<{ source: string; destination: string }> = [];

    if (restBackendOrigin) {
      rewrites.push({
        source: "/api/:path*",
        destination: `${restBackendOrigin}/:path*`,
      });
    }

    if (wsBackendOrigin) {
      rewrites.push({
        source: "/ws",
        destination: `${wsBackendOrigin}${wsBackendPath}`,
      });
    }

    return rewrites;
  },
};

export default nextConfig;
