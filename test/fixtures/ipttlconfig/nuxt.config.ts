import { defineNuxtConfig } from 'nuxt/config'
import nuxtApiShield from '../../../src/module'

export default defineNuxtConfig({
  modules: [nuxtApiShield],
  // @ts-expect-error: Nitro storage configuration is not fully typed in this test environment
  nitro: {
    storage: {
      shield: {
        driver: 'fs',
        base: '_testIpTTLConfig',
      },
    },
  },
  nuxtApiShield: {
    limit: {
      max: 2,
      duration: 3,
      ban: 10,
    },
    errorMessage: 'Leave me alone',
    retryAfterHeader: true,
    ipTTL: 3600,
    security: {
      trustXForwardedFor: true,
    },
    log: {
      path: '_logs',
      attempts: 3,
    },
  },
})
