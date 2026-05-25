import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  ...(process.env.CAPACITOR_BUILD ? { output: "export" } : {}),
  reactCompiler: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
