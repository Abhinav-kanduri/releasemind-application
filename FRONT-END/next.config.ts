import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  reactStrictMode: true,
  distDir:
    process.env.RELEASEMIND_NEXT_DIST_DIR === ".next-dev"
      ? ".next-dev"
      : ".next",
};
export default nextConfig;
