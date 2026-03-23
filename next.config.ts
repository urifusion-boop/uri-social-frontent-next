import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  async rewrites() {
    const backendUrl = process.env.BACKEND_API_URL || 'https://20.164.0.168';
    return [
      {
        source: '/social-media/:path*',
        destination: `${backendUrl}/social-media/:path*`,
      },
    ];
  },
};

export default nextConfig;
