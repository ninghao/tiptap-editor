import tailwindcss from '@tailwindcss/vite';

/**
 * Nuxt configuration
 *
 * This configuration file sets up the Nuxt application with the necessary
 * configurations for development and production environments.
 *
 * @see https://nuxt.com/docs/api/nuxt-config
 *
 */
export default defineNuxtConfig({
  /**
   * Set compatibility date for Nuxt
   */
  compatibilityDate: '2025-07-15',

  /**
   * Nuxt devtools for development
   */
  devtools: { enabled: true },

  /**
   * CSS files to include globally
   */
  css: ['~/assets/css/tailwind.css'],

  /**
   * Vite plugins
   */
  vite: {
    // Tailwind CSS
    plugins: [tailwindcss()],
  },

  /**
   * Nuxt Modules
   */
  modules: ['shadcn-nuxt'],
});
