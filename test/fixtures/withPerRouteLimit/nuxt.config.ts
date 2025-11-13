import nuxtApiShield from '../../../src/module'

export default defineNuxtConfig({
  modules: [nuxtApiShield],
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
