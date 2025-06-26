import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },
  // Configurações para desenvolvimento mobile
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Otimizações para desenvolvimento
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
  // Headers para melhor performance mobile
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
        ],
      },
    ];
  },
  // Configurações de imagens
  images: {
    domains: [],
    formats: ["image/webp", "image/avif"],
  },
  // Compressão
  compress: true,
  // Powered by header
  poweredByHeader: false,
};

export default nextConfig;
