export default defineNuxtConfig({
  modules: ["../src/module"],
  devtools: { enabled: true },
  nuxtApiShield: {
    limit: {
      max: 12,
      duration: 10,
      ban: 3600,
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
  },
});
