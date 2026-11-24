import type { LimitConfiguration, ResolvedRouteRule, ResolvedShieldConfig } from '../../../type'
import { matchesPattern, getPatternSpecificity } from './patternMatcher'

/**
 * Extract from config route path
 * @param routes contains array of route configuration
 */
export function extractRoutePaths(routes: Array<string | { path: string }>): string[] {
  return routes.map((route) => {
    if (typeof route === 'string') {
      return route
    }
    return route.path
  })
}

/**
 * Find the best matching Route rule for a given path
 * Prioritizes exact matches over wildcard matches based on specificity
 * @param path - pathname from event
 * @param config - The Resolved config (routes already normalized and validated)
 * @returns The matching Route rule or null if none found
 */
export function findBestMatchingRoute(path: string, config: ResolvedShieldConfig): ResolvedRouteRule | null {
  const routes = config.routes

  // No routes configured: every /api/ path is shielded with the global limit
  if (routes.length === 0) {
    return { path: '', pattern: false, ...config.limit }
  }

  // 1. Check for exact matches first
  const exactMatch = routes.find(route => !route.pattern && route.path === path)
  if (exactMatch) {
    return exactMatch
  }

  // 2. Find pattern matches and sort by specificity (most specific first)
  const patternMatches = routes
    .filter(route => route.pattern && matchesPattern(route.path, path))
    .sort((a, b) => getPatternSpecificity(b.path) - getPatternSpecificity(a.path))

  if (patternMatches.length > 0) {
    return patternMatches[0]!
  }

  // 3. Prefix matches on path segment boundaries, longest wins
  const prefixMatches = routes.filter(route =>
    path.startsWith(route.path) && (path.length === route.path.length || path[route.path.length] === '/'),
  )

  if (prefixMatches.length > 0) {
    return prefixMatches.reduce((prev, curr) => curr.path.length > prev.path.length ? curr : prev)
  }

  return null
}

/**
 * The limit that applies to a matched Route rule (global limit already merged in).
 */
export function getRouteLimit(matchingRoute: ResolvedRouteRule): LimitConfiguration {
  const { max, duration, ban } = matchingRoute
  return { max, duration, ban }
}

/**
 * Checks route path has a custom per-route limit defined.
 * @param path - pathname to check.
 * @param config - The Resolved config.
 * @returns True if a matching custom route limit exists, false otherwise.
 */
export function hasRouteLimit(path: string, config: ResolvedShieldConfig): boolean {
  return findBestMatchingRoute(path, config) !== null
}
