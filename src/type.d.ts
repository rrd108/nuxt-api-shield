import type { LogEntry } from './runtime/server/types/LogEntry'
import type { RateLimit } from './runtime/server/types/RateLimit'

export type { RateLimit }

export interface LimitConfiguration {
  max: number
  duration: number
  ban: number
}

export interface RouteLimitConfiguration extends Partial<LimitConfiguration> {
  path: string
}

export interface ModuleOptions {
  limit: LimitConfiguration
  delayOnBan: boolean
  errorMessage: string
  retryAfterHeader: boolean
  log?: LogEntry
  routes: Array<string | RouteLimitConfiguration>
}
