export default defineNuxtConfig({
  modules: ['../src/module'],
  nuxtApiShield: {
    limit: {
      max: 12,
      duration: 10,
      ban: 30,
    },
    delayOnBan: true,
    retryAfterHeader: true,
    log: {
      path: 'logs',
      attempts: 5,
    },
  },
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
  devtools: { enabled: true },
})
