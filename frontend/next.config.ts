import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // allow middleware (proxy) to work properly
  },
};

export default nextConfig;
