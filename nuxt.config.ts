// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  // SPA mode as per CLAUDE.md requirements
  ssr: false,

  modules: ['@nuxt/eslint', '@nuxt/image', '@nuxt/ui'],

  // Import Tailwind CSS
  css: ['~/assets/css/main.css'],

  // Color mode configuration for dark/light theme support
  colorMode: {
    preference: 'light', // Default to light mode
    fallback: 'light',
    classSuffix: '' // Use class="dark" instead of class="dark-mode"
  }
})