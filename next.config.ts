import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export for Vercel deployment (no server required)
  output: 'export',
  
  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },
  
  // Trailing slash for cleaner URLs
  trailingSlash: true,
};

export default nextConfig;
