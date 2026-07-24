import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion", "date-fns"],
  },
  turbopack: {
    root: "c:/Users/udayk/Downloads/AntiGravity/ksr-shipping",
  },
};

export default nextConfig;
