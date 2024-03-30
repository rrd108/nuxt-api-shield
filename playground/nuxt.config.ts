export default defineNuxtConfig({
  modules: ["../src/module"],
  nuxtApiShield: {
    limit: {
      max: 12,
      duration: 10,
      ban: 30,
    },
  },
  nitro: {
    storage: {
      shield: {
        //driver: "memory",
        driver: "fs",
        base: ".shield",
      },
    },
    experimental: {
      tasks: true,
    },
    scheduledTasks: {
      "* * * * *": ["shield:clean"],
    },
  },
  devtools: { enabled: true },
});
