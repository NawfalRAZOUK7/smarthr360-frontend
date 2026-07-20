import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Emit a self-contained server bundle (.next/standalone) with only the deps
  // Next actually traces — the Docker runtime then copies that instead of the
  // whole 458 MB node_modules, cutting image builds from tens of minutes to ~2.
  output: "standalone",
};

export default nextConfig;
