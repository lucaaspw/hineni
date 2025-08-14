/** @type {import('next').NextConfig} */

const nextConfig = {
  // Otimizações de performance
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-dialog",
      "@radix-ui/react-tabs",
    ],
    // Otimizações para produção
    optimizeCss: true,
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },

  // Compressão e otimizações
  compress: true,
  poweredByHeader: false,

  // Otimizações de imagens
  images: {
    domains: [],
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 dias
  },

  // Headers para cache e performance
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
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/api/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: process.env.NODE_ENV === 'production' 
              ? "public, max-age=120, s-maxage=300, stale-while-revalidate=60"
              : "public, max-age=300, s-maxage=600",
          },
          {
            key: "X-Response-Time",
            value: "0ms",
          },
        ],
      },
      // Headers específicos para APIs de músicas e repertório
      {
        source: "/api/musics",
        headers: [
          {
            key: "Cache-Control",
            value: process.env.NODE_ENV === 'production' 
              ? "public, max-age=120, s-maxage=300, stale-while-revalidate=60"
              : "public, max-age=300, s-maxage=600",
          },
        ],
      },
      {
        source: "/api/repertoire",
        headers: [
          {
            key: "Cache-Control",
            value: process.env.NODE_ENV === 'production' 
              ? "public, max-age=120, s-maxage=300, stale-while-revalidate=60"
              : "public, max-age=300, s-maxage=600",
          },
        ],
      },
    ];
  },

  // Otimizações do webpack
  webpack: (config, { dev, isServer }) => {
    // Otimizações para produção
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: "all",
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: "vendors",
              chunks: "all",
            },
            // Separar componentes UI em chunks menores
            ui: {
              test: /[\\/]components[\\/]ui[\\/]/,
              name: "ui-components",
              chunks: "all",
              priority: 20,
            },
          },
        },
        // Otimizações de runtime
        runtimeChunk: 'single',
      };

      // Otimizações para produção
      config.plugins = config.plugins || [];
      
      // Adicionar plugin para otimizar chunks
      if (config.optimization && config.optimization.splitChunks) {
        config.optimization.splitChunks.minSize = 20000;
        config.optimization.splitChunks.maxSize = 244000;
      }
    }

    // Otimizações para desenvolvimento
    if (dev && !isServer) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }

    return config;
  },

  // Configurações de performance
  onDemandEntries: {
    // Período em que a página será mantida em buffer
    maxInactiveAge: 25 * 1000,
    // Número de páginas que devem ser mantidas simultaneamente
    pagesBufferLength: 2,
  },

  // Otimizações de compilação
  swcMinify: true,
  
  // Configurações de PWA
  async rewrites() {
    return [
      {
        source: "/sw.js",
        destination: "/_next/static/sw.js",
      },
    ];
  },
};

export default nextConfig;
