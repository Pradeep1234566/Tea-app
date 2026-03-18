import type { NextConfig } from "next";

const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client"]
  }
};

module.exports = nextConfig;