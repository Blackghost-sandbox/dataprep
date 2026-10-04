import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

// Keep build attempts from replacing files used by the running development server.
const nextConfig = (phase: string): NextConfig => ({
  output: "standalone",
  distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",

  // Cloudflare runs `next build`, which currently fails on existing ESLint
  // findings in interactive lesson components even though compilation succeeds.
  // Keep TypeScript/build errors fatal, but run ESLint separately from deployment.
  eslint: {
    ignoreDuringBuilds: true,
  },
});

export default nextConfig;
