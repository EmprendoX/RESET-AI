import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@ai-coach/agent",
    "@ai-coach/config",
    "@ai-coach/db",
    "@ai-coach/prompts",
    "@ai-coach/shared",
    "@ai-coach/ui",
  ],
};

export default nextConfig;
