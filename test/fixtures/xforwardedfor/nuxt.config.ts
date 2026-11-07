import { defineNuxtConfig } from 'nuxt/config'
import nuxtApiShield from '../../../src/module'

export default defineNuxtConfig({
  modules: [nuxtApiShield],
  nitro: {
    storage: {
      shield: {
        driver: 'fs',
        base: '_testXForwardedForShield',
      },
    },
  },
  nuxtApiShield: {
    limit: {
      max: 2,
      duration: 3,
      ban: 10,
    },
    delayOnBan: false,
    log: { path: '', attempts: 0 },
    security: {
      trustXForwardedFor: true,
      trustedProxyHops: 1,
    },
  },
})
