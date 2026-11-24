import type { ModuleOptions } from './type'

export type { ModuleOptions }

/**
 * Typed helper for the Shield config file:
 *
 * ```ts
 * // .config/nuxt-api-shield.ts
 * import { defineShieldConfig } from 'nuxt-api-shield/config'
 *
 * export default defineShieldConfig({ limit: { max: 10 } })
 * ```
 */
export const defineShieldConfig = (config: ModuleOptions): ModuleOptions => config
