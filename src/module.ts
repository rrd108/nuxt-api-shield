import {
  defineNuxtModule,
  addPlugin,
  createResolver,
  addServerHandler,
  addServerImports,
  addTypeTemplate,
} from '@nuxt/kit'
import defu from 'defu'
import type { NitroConfig } from 'nitropack'
import type { ModuleOptions } from './type'

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-api-shield',
    configKey: 'nuxtApiShield',
  },
  defaults: {
    limit: {
      max: 12,
      duration: 108,
      ban: 3600,
    },
    delayOnBan: true,
    errorMessage: 'Too Many Requests',
    retryAfterHeader: false,
    log: { path: '', attempts: 0 },
    routes: [],
    ipTTL: 7 * 24 * 60 * 60,
    security: {
      trustXForwardedFor: true,
    },
  },
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    nuxt.options.runtimeConfig.public.nuxtApiShield = defu(
      nuxt.options.runtimeConfig.public.nuxtApiShield as ModuleOptions,
      options,
    ) as typeof nuxt.options.runtimeConfig.public.nuxtApiShield

    addServerImports([
      {
        name: 'isActualBanTimestampExpired',
        as: 'isActualBanTimestampExpired',
        from: resolver.resolve('./runtime/server/utils/isActualBanTimestampExpired'),
      },
    ])

    nuxt.hook('nitro:config', (nitroConfig: NitroConfig) => {
      nitroConfig.tasks = nitroConfig.tasks || {}

      nitroConfig.tasks['shield:cleanBans'] = {
        handler: resolver.resolve('./runtime/server/tasks/shield/cleanBans'),
        description: 'Clean expired bans from nuxt-api-shield storage.',
      }

      nitroConfig.tasks['shield:cleanIpData'] = {
        handler: resolver.resolve('./runtime/server/tasks/shield/cleanIpData'),
        description: 'Clean old IP tracking data from nuxt-api-shield storage.',
      }
    })

    // Make RateLimit type available via #imports for type-only imports
    addTypeTemplate({
      filename: 'types/nuxt-api-shield.d.ts',
      getContents: () => `declare module '#imports' {
  export type { RateLimit } from '${resolver.resolve('./runtime/server/types/RateLimit')}'
}`,
    }, {
      nitro: true,
    })

    addServerHandler({
      middleware: true,
      handler: resolver.resolve('./runtime/server/middleware/shield'),
    })

    addPlugin(resolver.resolve('./runtime/plugin'))
  },
})
