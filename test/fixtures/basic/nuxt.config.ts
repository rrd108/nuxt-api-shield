import nuxtApiShield from "../../../src/module";

export default defineNuxtConfig({
  modules: [nuxtApiShield],
  nuxtApiShield: {
    limit: {
      max: 2,
      duration: 10,
      ban: 3,
    },
  },
  nitro: {
    storage: {
      shield: {
        driver: "memory",
      },
    },
  },
});
