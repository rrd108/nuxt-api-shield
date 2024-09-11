import nuxtApiShield from "../../../src/module";

export default defineNuxtConfig({
  modules: [nuxtApiShield],
  nuxtApiShield: {
    limit: {
      max: 2,
      duration: 3,
      ban: 10,
    },
    errorMessage: "Leave me alone",
    retryAfterHeader: true,
    log: false,
    routes: ["/api/v3"],
  },
  nitro: {
    storage: {
      shield: {
        //driver: "memory",
        driver: "fs",
        base: "_testWithRoutesShield",
      },
    },
  },
});
