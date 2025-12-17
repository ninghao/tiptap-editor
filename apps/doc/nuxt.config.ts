// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  /**
   * Set compatibility date for Nuxt
   *
   * This ensures consistent behavior across different Nuxt versions
   * and prevents breaking changes from affecting the application.
   */
  compatibilityDate: '2024-11-01',

  /**
   * Enable Nuxt DevTools
   *
   * DevTools provides debugging and development features
   * including component inspection, performance monitoring,
   * and various development utilities.
   */
  devtools: { enabled: true },

  /**
   * Disable telemetry collection
   *
   * Telemetry is disabled to prevent data collection and improve privacy.
   * This setting prevents Nuxt from sending usage statistics and analytics.
   */
  telemetry: false,

  /**
   * Nuxt layers configuration
   *
   * Extends functionality from shared Nuxt layers to reuse components,
   * composables, and configurations across the application.
   * This allows for code sharing and consistent behavior across packages.
   */
  extends: ['@shu/ui', '@shu/common'],
});
