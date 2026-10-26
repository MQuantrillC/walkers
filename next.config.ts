import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // A stray lockfile in the home directory otherwise makes Next.js guess the
  // wrong workspace root.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
