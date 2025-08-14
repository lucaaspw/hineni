/** @type {import('next').NextConfig} */

const nextConfig = {
  // Otimizações de performance para produção
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-dialog",
      "@radix-ui/react-tabs",
    ],
    // Otimizações agressivas para produção
    optimizeCss: true,
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
    // Otimizações de bundle
    bundlePagesExternals: true,
    // Otimizações de CSS
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-dialog",
      "@radix-ui/react-tabs",
    ],
  },

  // Compressão e otimizações para produção
  compress: true,
  poweredByHeader: false,
  generateEtags: true,

  // Otimizações de imagens para produção
  images: {
    domains: [],
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 dias
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Headers otimizados para produção
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
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
        ],
      },
      {
        source: "/api/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=120, s-maxage=300, stale-while-revalidate=60",
          },
          {
            key: "X-Response-Time",
            value: "0ms",
          },
          {
            key: "X-Cache-Control",
            value: "public, max-age=120",
          },
        ],
      },
      // Headers específicos para APIs críticas
      {
        source: "/api/musics",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=120, s-maxage=300, stale-while-revalidate=60",
          },
          {
            key: "X-API-Version",
            value: "1.0",
          },
        ],
      },
      {
        source: "/api/repertoire",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=120, s-maxage=300, stale-while-revalidate=60",
          },
          {
            key: "X-API-Version",
            value: "1.0",
          },
        ],
      },
      // Headers para assets estáticos
      {
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  // Otimizações do webpack para produção
  webpack: (config, { dev, isServer }) => {
    // Otimizações específicas para produção
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
              priority: 10,
            },
            // Separar componentes UI em chunks menores
            ui: {
              test: /[\\/]components[\\/]ui[\\/]/,
              name: "ui-components",
              chunks: "all",
              priority: 20,
            },
            // Separar componentes principais
            components: {
              test: /[\\/]components[\\/]/,
              name: "main-components",
              chunks: "all",
              priority: 15,
            },
            // Separar páginas
            pages: {
              test: /[\\/]app[\\/]/,
              name: "pages",
              chunks: "all",
              priority: 25,
            },
          },
          // Otimizações de tamanho
          minSize: 20000,
          maxSize: 244000,
          enforceSizeThreshold: 50000,
        },
        // Otimizações de runtime
        runtimeChunk: 'single',
        // Otimizações de módulos
        moduleIds: 'deterministic',
        chunkIds: 'deterministic',
      };

      // Plugins para produção
      config.plugins = config.plugins || [];
      
      // Otimizações de bundle
      if (config.optimization && config.optimization.splitChunks) {
        config.optimization.splitChunks.minSize = 20000;
        config.optimization.splitChunks.maxSize = 244000;
      }

      // Otimizações para tree shaking
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
    }

    return config;
  },

  // Configurações de performance para produção
  onDemandEntries: {
    // Período em que a página será mantida em buffer (reduzido para produção)
    maxInactiveAge: 15 * 1000,
    // Número de páginas que devem ser mantidas simultaneamente (reduzido para produção)
    pagesBufferLength: 1,
  },

  // Otimizações de compilação para produção
  swcMinify: true,
  
  // Configurações de PWA para produção
  async rewrites() {
    return [
      {
        source: "/sw.js",
        destination: "/_next/static/sw.js",
      },
    ];
  },

  // Configurações de output para produção
  output: 'standalone',
  
  // Configurações de experimental para produção
  experimental: {
    // Otimizações de bundle
    bundlePagesExternals: true,
    // Otimizações de CSS
    optimizeCss: true,
    // Otimizações de imagens
    optimizeImages: true,
  },
};

export default nextConfig; 