import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: 'http://backend:2365/uploads/:path*',
      },
      {
        source: '/api/:path*',
        destination: 'http://backend:2365/api/:path*',
      },
    ];
  },
};

export default nextConfig;
