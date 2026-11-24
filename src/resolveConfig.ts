import { createDefu } from 'defu'
import type { ModuleOptions, ResolvedRouteRule, ResolvedShieldConfig } from './type'
import { patternProblem } from './runtime/server/utils/patternMatcher'

export const SHIELD_DEFAULTS: Omit<ResolvedShieldConfig, 'routes'> & { routes: Array<string> } = {
  limit: {
    max: 12,
    duration: 108,
    ban: 3600,
  },
  delayOnBan: true,
  errorMessage: 'Too Many Requests',
  retryAfterHeader: false,
  log: { path: '', attempts: 0, fail2ban: false },
  routes: [],
  skipRoutes: [],
  ipTTL: 7 * 24 * 60 * 60,
  storageKeyPrefix: '',
  security: {
    trustXForwardedFor: false,
    trustedProxyHops: 1,
  },
}

/** The Config sources, each as the user wrote it (or undefined when not set). */
export interface ShieldConfigSources {
  /** `runtimeConfig.nuxtApiShield` in nuxt.config */
  runtimeConfig?: ModuleOptions
  /** The inline `nuxtApiShield` key (or inline module options) in nuxt.config */
  inline?: ModuleOptions
  /** The Shield config file, `.config/nuxt-api-shield.<ext>` */
  file?: ModuleOptions
}

export interface ResolvedShieldConfigResult {
  config: ResolvedShieldConfig
  warnings: string[]
}

// Objects deep-merge, arrays are taken whole from the highest source that
// sets them (see docs/adr/0001-config-source-precedence.md).
const mergeSources = createDefu((target, key, value) => {
  if (Array.isArray(value)) {
    (target as Record<string, unknown>)[key as string] = value
    return true
  }
})

const hasKeys = (options?: ModuleOptions) => !!options && Object.keys(options).length > 0

// Request paths are matched without trailing slashes (see normalizePath), so a
// configured "/api/v2/" would never match anything. Strip them here too.
const stripTrailingSlashes = (path: string) => path.replace(/\/+$/, '') || '/'

const resolveRoute = (route: NonNullable<ModuleOptions['routes']>[number], limit: ResolvedShieldConfig['limit']): ResolvedRouteRule => {
  const rule = typeof route === 'string' ? { path: route } : route
  const path = stripTrailingSlashes(rule.path)
  const pattern = rule.pattern === true
  if (pattern) {
    const problem = patternProblem(path)
    if (problem) {
      throw new Error(`[nuxt-api-shield] Invalid wildcard route "${rule.path}": the pattern ${problem}.`)
    }
  }
  return {
    path,
    pattern,
    max: rule.max ?? limit.max,
    duration: rule.duration ?? limit.duration,
    ban: rule.ban ?? limit.ban,
  }
}

/**
 * Merge every Config source over the defaults into the Resolved config.
 *
 * Precedence, highest first: runtimeConfig, inline, file, defaults.
 * Throws on an invalid wildcard route. Returns warnings for the caller to print.
 */
export function resolveShieldConfig(sources: ShieldConfigSources): ResolvedShieldConfigResult {
  const warnings: string[] = []

  if (hasKeys(sources.inline) && hasKeys(sources.file)) {
    warnings.push(
      '[nuxt-api-shield] Options are set both inline in nuxt.config and in the Shield config file. '
      + 'Inline options win; keep them in one place.',
    )
  }

  const merged = mergeSources(
    {},
    sources.runtimeConfig ?? {},
    sources.inline ?? {},
    sources.file ?? {},
    structuredClone(SHIELD_DEFAULTS),
  ) as typeof SHIELD_DEFAULTS & { routes: NonNullable<ModuleOptions['routes']> }

  const config: ResolvedShieldConfig = {
    ...merged,
    routes: merged.routes.map(route => resolveRoute(route, merged.limit)),
    skipRoutes: merged.skipRoutes.map(stripTrailingSlashes),
  }

  return { config, warnings }
}
