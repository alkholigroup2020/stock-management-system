// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },

  // SPA mode as per CLAUDE.md requirements
  ssr: false,

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

  modules: ["@nuxt/eslint", "@nuxt/image", "@nuxt/ui", "nuxt-auth-utils"],

  // Import Tailwind CSS
  css: ["~/assets/css/main.css"],

  // Nuxt UI configuration
  // Note: Custom colors are configured via CSS variables in main.css
  // No need to register colors here when using CSS variables approach

  // Color mode configuration for dark/light theme support
  colorMode: {
    preference: "light", // Default to light mode
    fallback: "light",
    classSuffix: "", // Use class="dark" instead of class="dark-mode"
  },

  // Auth configuration using nuxt-auth-utils
  auth: {
    // Session configuration
    session: {
      // Use httpOnly cookies for security (prevents XSS attacks)
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // HTTPS only in production
        sameSite: "lax", // CSRF protection
      },
      // JWT token expiration: 7 days (in seconds)
      maxAge: 7 * 24 * 60 * 60, // 604800 seconds = 7 days
    },
  },
});
