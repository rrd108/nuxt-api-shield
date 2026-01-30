import type { LimitConfiguration, ModuleOptions } from '../../../type'
import { matchesPattern, getPatternSpecificity, validatePattern } from './patternMatcher'

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
 * Find the best matching route configuration for a given path
 * Prioritizes exact matches over wildcard matches based on specificity
 * @param path - pathname from event
 * @param config - The module configuration containing route definitions
 * @returns The matching route configuration or null if none found
 */
export function findBestMatchingRoute(path: string, config: ModuleOptions) {
  const routeConfigs = config.routes || []

  // If no routes are configured, we return a default object to indicate it's a global match
  if (routeConfigs.length === 0) {
    return { path: '' }
  }

  // 1. Check for exact matches first
  const exactMatches = routeConfigs.filter((route: string | { path: string, pattern?: boolean }) => {
    if (typeof route === 'string') {
      return route === path
    }
    return !route.pattern && route.path === path
  })

  if (exactMatches.length > 0) {
    const match = exactMatches[0]
    return typeof match === 'string' ? { path: match } : match
  }

  // 2. Find pattern matches and sort by specificity (most specific first)
  const patternMatches = routeConfigs
    .filter((route): route is { path: string, pattern?: boolean } & Partial<LimitConfiguration> => {
      if (typeof route === 'string') return false
      return route.pattern === true && validatePattern(route.path)
    })
    .filter((route: { path: string, pattern?: boolean } & Partial<LimitConfiguration>) => matchesPattern(route.path, path))
    .sort((a: { path: string }, b: { path: string }) => getPatternSpecificity(b.path) - getPatternSpecificity(a.path))

  if (patternMatches.length > 0) {
    return patternMatches[0]
  }

  // 3. Backward compatibility: Check for prefix matches if route is a string
  const prefixMatches = routeConfigs
    .filter((route): route is string | { path: string } => {
      const routePath = typeof route === 'string' ? route : route.path
      return path.startsWith(routePath)
    })

  if (prefixMatches.length > 0) {
    // Return the longest prefix match
    const bestPrefix = prefixMatches.reduce((prev, curr) => {
      const prevPath = typeof prev === 'string' ? prev : prev.path
      const currPath = typeof curr === 'string' ? curr : curr.path
      return currPath.length > prevPath.length ? curr : prev
    })
    return typeof bestPrefix === 'string' ? { path: bestPrefix } : bestPrefix
  }

  return null
}

/**
 * This function merges the global `limit` configuration with the per-route
 *
 * @param path - pathname from event
 * @param config - The module configuration containing global and per-route settings.
 * @returns The merged rate limit configuration for the route.
 */
export function getRouteLimit(path: string, config: ModuleOptions): LimitConfiguration {
  const matchingRoute = findBestMatchingRoute(path, config)

  if (!matchingRoute) {
    return config.limit
  }

  // Merge global limit with route-specific overrides
  return Object.assign({}, config.limit, matchingRoute)
}

/**
 * Checks route path has a custom per-route limit defined.
 * @param path - pathname to check.
 * @param config - The module configuration containing route definitions.
 * @returns True if a matching custom route limit exists, false otherwise.
 */
export function hasRouteLimit(path: string, config: ModuleOptions): boolean {
  return findBestMatchingRoute(path, config) !== null
}
