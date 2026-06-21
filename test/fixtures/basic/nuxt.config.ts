import { defineNuxtConfig } from 'nuxt/config'
import nuxtApiShield from '../../../src/module'

export default defineNuxtConfig({
  modules: [nuxtApiShield],
  // @ts-expect-error: Nitro storage configuration is not fully typed in this test environment
  nitro: {
    storage: {
      shield: {
        // driver: "memory",
        driver: 'fs',
        base: '_testBasicShield',
      },
    },
  },
  nuxtApiShield: {
    limit: {
      max: 2,
      duration: 2,
      ban: 4,
    },
    errorMessage: 'Leave me alone',
    retryAfterHeader: true,
    log: {
      path: '_logs',
      attempts: 3,
    },
  },
})
