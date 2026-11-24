import { defineNuxtConfig } from 'nuxt/config'
import nuxtApiShield from '../../../src/module'

export default defineNuxtConfig({
  modules: [nuxtApiShield],
  nitro: {
    experimental: {
      tasks: true,
    },
    storage: {
      shield: {
        driver: 'fs',
        base: '_testKeyPrefixShield',
      },
    },
  },
  nuxtApiShield: {
    storageKeyPrefix: 'myapp:',
    limit: {
      max: 1,
      duration: 10,
      ban: 10,
    },
    delayOnBan: false,
  },
})
