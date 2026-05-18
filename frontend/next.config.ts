import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: 'http://localhost:2365/uploads/:path*',
      },
      {
        source: '/api/:path*',
        destination: 'http://localhost:2365/api/:path*',
      },
    ];
  },
};

export default nextConfig;
