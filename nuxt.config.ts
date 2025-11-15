// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },

  // SPA mode as per CLAUDE.md requirements
  ssr: false,

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

  modules: ["@nuxt/eslint", "@nuxt/image", "@nuxt/ui", "@pinia/nuxt", "nuxt-auth-utils"],

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
      ],
    },
  },
});
