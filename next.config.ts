import type { NextConfig } from "next";
import "./src/env"; // fail at boot on a bad environment

const nextConfig: NextConfig = {
  agentRules: false, // agent files are added by step 0.4, not written by `next dev`
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
