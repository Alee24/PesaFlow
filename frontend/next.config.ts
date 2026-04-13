import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: 'http://localhost:5454/uploads/:path*',
      },
      {
        source: '/api/:path*',
        destination: 'http://localhost:5454/api/:path*',
      },
    ];
  },
};

export default nextConfig;
