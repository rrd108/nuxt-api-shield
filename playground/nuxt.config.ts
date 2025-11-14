export default defineNuxtConfig({
  modules: ['../src/module'],
  devtools: { enabled: true },
  compatibilityDate: '2025-07-09',
  nitro: {
    storage: {
      shield: {
        // driver: "memory",
        driver: 'fs',
        base: '.shield',
      },
    },
    experimental: {
      tasks: true,
    },
    scheduledTasks: {
      '*/5 * * * *': ['shield:clean'],
    },
  },
  nuxtApiShield: {
    limit: {
      max: 12,
      duration: 10,
      ban: 30,
    },
    routes: [
      '/api/example',
      {
        path: '/api/example-per-route',
        max: 5,
        duration: 10,
      },
    ],
    delayOnBan: true,
    retryAfterHeader: true,
    log: {
      path: 'logs',
      attempts: 5,
    },
  },
})
