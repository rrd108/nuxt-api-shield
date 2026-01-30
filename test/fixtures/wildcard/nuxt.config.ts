import { defineNuxtConfig } from 'nuxt/config'
import nuxtApiShield from '../../../src/module'

export default defineNuxtConfig({
  modules: [nuxtApiShield],
  // @ts-expect-error: Nitro storage configuration is not fully typed in this test environment
  nitro: {
    storage: {
      shield: {
        driver: 'fs',
        base: '_testWildcardShield',
      },
    },
  },
  nuxtApiShield: {
    limit: {
      max: 10, // Default high limit for non-matching routes
      duration: 60,
      ban: 30,
    },
    errorMessage: 'Too Many Requests',
    retryAfterHeader: true,
    log: { path: '', attempts: 0 },
    routes: [
      // Wildcard pattern with lower limits
      {
        path: '/api/users/*/profile',
        pattern: true,
        max: 2,
        duration: 60,
        ban: 30,
      },
      // Multi-segment wildcard pattern
      {
        path: '/api/reports/**/summary',
        pattern: true,
        max: 2,
        duration: 60,
        ban: 30,
      },
      // Exact match (should take precedence over wildcards)
      {
        path: '/api/admin/special',
        max: 5, // Higher limit than wildcards
        duration: 60,
        ban: 30,
      },
    ],
  },
})
