import { defineNuxtConfig } from 'nuxt/config'
import nuxtApiShield from '../../../src/module'

export default defineNuxtConfig({
  modules: [nuxtApiShield],
  nitro: {
    storage: {
      shield: {
        driver: 'fs',
        base: '_testSkipRoutesShield',
      },
    },
  },
  nuxtApiShield: {
    limit: {
      max: 2,
      duration: 10,
      ban: 30,
    },
    skipRoutes: ['/api/health'],
  },
})
