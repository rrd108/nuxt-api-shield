import type { LogEntry } from './runtime/server/types/LogEntry'
import type { RateLimit } from './runtime/server/types/RateLimit'

export type { RateLimit, LogEntry }

export interface LimitConfiguration {
  max: number
  duration: number
  ban: number
}

export interface RouteLimitConfiguration extends Partial<LimitConfiguration> {
  path: string
  /**
   * Indicates if the path contains wildcard patterns (* or **)
   * When true, the path will be treated as a glob pattern for matching
   */
  pattern?: boolean
}

/**
 * Options as the user writes them, in nuxt.config, runtimeConfig or the
 * Shield config file (`.config/nuxt-api-shield.ts`). Every field is optional;
 * missing ones come from the defaults.
 */
export interface ModuleOptions {
  limit?: Partial<LimitConfiguration>
  delayOnBan?: boolean
  errorMessage?: string
  retryAfterHeader?: boolean
  log?: Partial<LogEntry>
  routes?: Array<string | RouteLimitConfiguration>
  skipRoutes?: string[]
  ipTTL?: number
  /**
   * Prepended to every storage key (e.g. "myapp:" gives "myapp:ip:..." and "myapp:ban:...").
   * Use it to keep apps or environments that share one storage (Redis) apart. Default: "".
   */
  storageKeyPrefix?: string
  security?: {
    trustXForwardedFor?: boolean
    /**
     * Number of trusted proxies in front of the app that append to X-Forwarded-For.
     * The client IP is read this many entries from the right. Default: 1.
     */
    trustedProxyHops?: number
  }
}

/** A route rule with the global limit already merged in. */
export interface ResolvedRouteRule extends LimitConfiguration {
  path: string
  pattern: boolean
}

/**
 * The Resolved config: every Config source merged over the defaults, nothing
 * optional. This is the only shape the request-time code reads.
 */
export interface ResolvedShieldConfig {
  limit: LimitConfiguration
  delayOnBan: boolean
  errorMessage: string
  retryAfterHeader: boolean
  log: Required<LogEntry>
  routes: ResolvedRouteRule[]
  skipRoutes: string[]
  ipTTL: number
  storageKeyPrefix: string
  security: {
    trustXForwardedFor: boolean
    trustedProxyHops: number
  }
}
