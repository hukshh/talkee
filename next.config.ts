import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve("."), // Explicitly set to current dir
  },
};

export default nextConfig;
