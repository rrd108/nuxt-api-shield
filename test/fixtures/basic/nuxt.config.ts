import nuxtApiShield from '../../../src/module'

export default defineNuxtConfig({
  modules: [nuxtApiShield],
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
      duration: 3,
      ban: 10,
    },
    errorMessage: 'Leave me alone',
    retryAfterHeader: true,
    log: {
      path: '_logs',
      attempts: 3,
    },
  },
})
