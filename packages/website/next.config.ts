import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  outputFileTracingRoot: path.join(__dirname, "../.."),
  transpilePackages: ["@gaialynk/shared"],
  images: {
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    optimizePackageImports: ["framer-motion"],
  },
  async redirects() {
    return [
      { source: "/en/demo", destination: "/en/help", permanent: true },
      { source: "/zh-Hant/demo", destination: "/zh-Hant/help", permanent: true },
      { source: "/zh-Hans/demo", destination: "/zh-Hans/help", permanent: true },
    ];
  },
};

export default nextConfig;
