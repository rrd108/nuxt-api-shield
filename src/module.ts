import {
  defineNuxtModule,
  addPlugin,
  createResolver,
  addServerHandler,
  addServerImports,
} from '@nuxt/kit'
import defu from 'defu'
import type { LogEntry } from './runtime/server/types/LogEntry'

export interface ModuleOptions {
  limit: {
    max: number
    duration: number
    ban: number
  }
  delayOnBan: boolean
  errorMessage: string
  retryAfterHeader: boolean
  log?: LogEntry
  routes: string[]
}

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
  },
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    nuxt.options.runtimeConfig.public.nuxtApiShield = defu(
      nuxt.options.runtimeConfig.public.nuxtApiShield,
      options,
    )

    addServerImports([
      {
        name: 'RateLimit',
        as: 'RateLimit',
        from: resolver.resolve('./runtime/server/types/RateLimit'),
      },
      {
        name: 'isBanExpired',
        as: 'isBanExpired',
        from: resolver.resolve('./runtime/server/utils/isBanExpired'),
      },
    ])

    addServerHandler({
      middleware: true,
      handler: resolver.resolve('./runtime/server/middleware/shield'),
    })

    addPlugin(resolver.resolve('./runtime/plugin'))
  },
})
