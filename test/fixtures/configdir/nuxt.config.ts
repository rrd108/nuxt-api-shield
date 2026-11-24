import { defineNuxtConfig } from 'nuxt/config'
import nuxtApiShield from '../../../src/module'

// No `nuxtApiShield` key here: every option comes from .config/nuxt-api-shield.ts
export default defineNuxtConfig({
  modules: [nuxtApiShield],
  nitro: {
    storage: {
      shield: {
        driver: 'fs',
        base: '_testConfigDirShield',
      },
    },
  },
})
