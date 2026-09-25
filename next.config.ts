import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self), interest-cohort=()",
  },
];

const nextConfig: NextConfig = {
  output: "standalone",
  skipTrailingSlashRedirect: true,
  poweredByHeader: false,
  compress: true,
  devIndicators: false,
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion", "date-fns"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  async redirects() {
    return [
      {
        // Match any path that does NOT start with 'api/webhooks/delhivery/b2c'
        // The regex (.*) captures the entire path into the :path variable
        source: '/:path((?!api/webhooks/delhivery/b2c).*)',
        has: [
          {
            type: 'host',
            value: 'ksrshipping.com',
          },
        ],
        destination: 'https://www.ksrshipping.com/:path',
        permanent: true,
      },
      {
        // Source for the root path '/' since '/:path(...)' does not match empty paths
        source: '/',
        has: [
          {
            type: 'host',
            value: 'ksrshipping.com',
          },
        ],
        destination: 'https://www.ksrshipping.com/',
        permanent: true,
      }
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        source: "/(.*\\.(?:ico|png|jpg|jpeg|svg|webp|avif|woff2))",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
