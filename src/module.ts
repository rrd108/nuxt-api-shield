import {
  defineNuxtModule,
  createResolver,
  addServerHandler,
  addServerImports,
  addTypeTemplate,
} from '@nuxt/kit'
import { loadConfig } from 'c12'
import type { ModuleOptions } from './type'
import { resolveShieldConfig } from './resolveConfig'

export type { ModuleOptions, RouteLimitConfiguration, ResolvedShieldConfig, ResolvedRouteRule } from './type'

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-api-shield',
    configKey: 'nuxtApiShield',
  },
  // No `defaults` here on purpose: Nuxt would merge them into the inline
  // options before setup(), and the Shield config file could never override
  // them. resolveShieldConfig() applies SHIELD_DEFAULTS last instead.
  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    const publicRuntimeConfig = nuxt.options.runtimeConfig.public as Record<string, unknown>
    if (publicRuntimeConfig.nuxtApiShield) {
      throw new Error(
        '[nuxt-api-shield] "runtimeConfig.public.nuxtApiShield" is no longer supported (v2) and would expose '
        + 'your config to the browser. Move it to "runtimeConfig.nuxtApiShield", the "nuxtApiShield" key, '
        + 'or ".config/nuxt-api-shield.ts".',
      )
    }

    const shieldConfigFile = await loadConfig<ModuleOptions>({
      name: 'nuxt-api-shield',
      cwd: nuxt.options.rootDir,
      rcFile: false,
      globalRc: false,
      packageJson: false,
      dotenv: false,
    })
    if (shieldConfigFile._configFile) {
      nuxt.options.watch.push(shieldConfigFile._configFile)
    }

    // Keep the Resolved config in the private (server-only) runtime config.
    // Public runtime config is serialized into every HTML page, which would
    // expose limits, skipRoutes and the log path to anyone.
    const { config, warnings } = resolveShieldConfig({
      runtimeConfig: nuxt.options.runtimeConfig.nuxtApiShield as ModuleOptions | undefined,
      inline: options,
      file: shieldConfigFile._configFile ? shieldConfigFile.config : undefined,
    })
    for (const warning of warnings) {
      console.warn(warning)
    }
    nuxt.options.runtimeConfig.nuxtApiShield = config as typeof nuxt.options.runtimeConfig.nuxtApiShield

    nuxt.hook('modules:done', () => {
      const nitroStorage = nuxt.options.nitro?.storage
      if (!nitroStorage?.shield) {
        console.warn(
          '[nuxt-api-shield] Missing storage configuration: "nitro.storage.shield".\n'
          + 'Add a "shield" storage entry to your nuxt.config, for example:\n\n'
          + '  nitro: {\n'
          + '    storage: {\n'
          + '      shield: { driver: "fs", base: "./shield" }\n'
          + '    }\n'
          + '  }\n\n'
          + 'The module will work but rate limit data resets on restart.',
        )
      }
    })

    addServerImports([
      {
        name: 'isActualBanTimestampExpired',
        as: 'isActualBanTimestampExpired',
        from: resolver.resolve('./runtime/server/utils/isActualBanTimestampExpired'),
      },
    ])

    // Only `tasks` is touched here. Typing it locally avoids importing
    // nitropack's types, which the module build would inline into dist.
    nuxt.hook('nitro:config', (nitroConfig: { tasks?: Record<string, { handler?: string, description?: string } | undefined> }) => {
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
  },
})
