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
        base: '_testWithRoutesLimiteShield',
      },
    },
  },
  nuxtApiShield: {
    limit: {
      max: 2,
      duration: 3,
      ban: 10,
    },
    errorMessage: 'Wait ! Something went wrong',
    retryAfterHeader: true,
    log: { path: '', attempts: 0 },
    routes: [
      '/api/example',
      {
        path: '/api/example-specific-limit',
        max: 1,
        duration: 2,
        ban: 50,
      },
    ],
  },
})
