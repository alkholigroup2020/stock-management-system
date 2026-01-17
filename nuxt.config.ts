// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },

  // SPA mode as per CLAUDE.md requirements
  ssr: false,

  // Build configuration - fix Windows ESM loader path issue
  build: {
    transpile: ["@nuxt/image"],
  },

  // Dev server configuration - hardcoded to port 3000
  devServer: {
    port: 3000,
    host: "localhost",
  },

  // Runtime configuration for environment variables
  runtimeConfig: {
    // Private keys (server-only) - never exposed to client
    databaseUrl: process.env.DATABASE_URL,
    supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY,
    authSecret: process.env.AUTH_SECRET,

    // Public keys (exposed to client)
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || "http://localhost:3000",
      currency: process.env.NUXT_PUBLIC_CURRENCY || "SAR",
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    },
  },

  modules: ["@nuxt/eslint", "@nuxt/ui", "@pinia/nuxt", "nuxt-auth-utils", "@vite-pwa/nuxt"],

  // PWA Configuration
  pwa: {
    registerType: "autoUpdate",
    manifest: {
      name: "Stock Management System",
      short_name: "FoodStock",
      description: "Multi-Location Inventory Management System",
      theme_color: "#000046", // Navy blue - primary brand color
      background_color: "#000046",
      display: "standalone",
      orientation: "portrait",
      icons: [
        {
          src: "/icon-192.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "any maskable",
        },
        {
          src: "/icon-512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any maskable",
        },
      ],
    },
    workbox: {
      navigateFallback: "/",
      // Exclude API routes from navigation fallback to prevent service worker from intercepting
      navigateFallbackDenylist: [/^\/api\/.*/],
      globPatterns: ["**/*.{js,css,html,png,svg,ico,woff2}"],
      cleanupOutdatedCaches: true,
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
          handler: "CacheFirst",
          options: {
            cacheName: "google-fonts-cache",
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
        {
          urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
          handler: "CacheFirst",
          options: {
            cacheName: "gstatic-fonts-cache",
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
      ],
    },
    client: {
      installPrompt: true,
    },
    devOptions: {
      enabled: true,
      type: "module",
    },
  },

  // Import Tailwind CSS
  css: ["~/assets/css/main.css"],

  // Nuxt UI configuration
  // Note: Colors are defined via CSS variables in assets/css/main.css
  // Primary color: Navy Blue (#000046)
  // Secondary color: Emerald Green (#45cf7b)

  // Color mode configuration for dark/light theme support
  colorMode: {
    preference: "light", // Default to light mode
    fallback: "light",
    classSuffix: "", // Use class="dark" instead of class="dark-mode"
  },

  // Auth configuration using nuxt-auth-utils
  // Note: Session settings (httpOnly cookies, maxAge, etc.) are configured
  // automatically by nuxt-auth-utils using the AUTH_SECRET environment variable.
  // Default session settings:
  // - httpOnly: true (XSS protection)
  // - secure: true in production (HTTPS only)
  // - sameSite: 'lax' (CSRF protection)
  // - maxAge: 7 days (604800 seconds)

  // Accessibility: Set HTML lang attribute
  app: {
    head: {
      htmlAttrs: {
        lang: "en",
      },
      title: "Stock Management System",
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { name: "description", content: "Multi-Location Inventory Management System" },
        // PWA meta tags
        { name: "theme-color", content: "#000046" },
        { name: "mobile-web-app-capable", content: "yes" },
        { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
        { name: "apple-mobile-web-app-title", content: "FoodStock" },
      ],
      link: [
        // PWA manifest link
        { rel: "manifest", href: "/manifest.webmanifest" },
        // Apple touch icon
        { rel: "apple-touch-icon", href: "/icon-192.png" },
      ],
    },
  },

  // Router configuration for performance
  router: {
    options: {
      // Scroll behavior for better UX
      scrollBehaviorType: "smooth",
    },
  },

  // Experimental features for performance
  experimental: {
    // Enable component islands for better loading performance
    componentIslands: true,
    // Enable payload extraction for faster hydration
    payloadExtraction: true,
  },

  // Nitro configuration for server-side bundling
  nitro: {
    // Use Vercel preset only in production (Vercel handles Prisma automatically)
    // For local builds, don't specify preset (defaults to node-server)
    preset: process.env.VERCEL ? "vercel" : undefined,
    // Module bundling configuration
    moduleSideEffects: ["@prisma/client"],
    // Force bundle xlsx with all its dependencies including cpexcel.js
    externals: {
      inline: ["xlsx"],
    },
    // Custom rollup config to handle Prisma and fix Windows paths
    rollupConfig: {
      plugins: [
        {
          name: "prisma-resolver",
          resolveId(source: string) {
            // Mark .prisma imports as external to prevent bundling issues
            if (source.startsWith(".prisma")) {
              return { id: source, external: true };
            }
            return null;
          },
        },
        {
          name: "fix-windows-imports",
          renderChunk(code: string) {
            // Fix bare Windows paths in generated code
            return code.replace(
              /from\s+['"]([A-Za-z]):\\\\([^'"]+)['"]/g,
              (match: string, drive: string, path: string) => {
                const normalizedPath = path.replace(/\\\\/g, "/");
                return `from 'file:///${drive}:/${normalizedPath}'`;
              }
            );
          },
        },
      ],
    },
  },

  // Vite configuration for bundle optimization
  vite: {
    build: {
      // Optimize chunk size
      chunkSizeWarningLimit: 500,
      // Note: Manual chunk splitting removed as it can cause circular dependency issues on Vercel
    },
    // Optimize dependencies
    optimizeDeps: {
      include: ["vue", "@nuxt/ui", "pinia"],
    },
  },
});
