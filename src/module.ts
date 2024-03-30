import {
  defineNuxtModule,
  addPlugin,
  createResolver,
  addServerHandler,
} from "@nuxt/kit";
import defu from "defu";

export interface ModuleOptions {
  limit: {
    max: number;
    duration: number;
    ban: number;
  };
  delayOnBan: boolean;
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: "nuxt-api-shield",
    configKey: "nuxtApiShield",
  },
  defaults: {
    limit: {
      max: 12,
      duration: 108,
      ban: 3600,
    },
    delayOnBan: true,
  },
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url);

    nuxt.options.runtimeConfig.public.nuxtApiShield = defu(
      nuxt.options.runtimeConfig.public.nuxtApiShield,
      options
    );

    addServerHandler({
      middleware: true,
      handler: resolver.resolve("./runtime/server/middleware/shield"),
    });

    addPlugin(resolver.resolve("./runtime/plugin"));
  },
});
