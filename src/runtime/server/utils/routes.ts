import type { LimitConfiguration, ModuleOptions } from '~/src/type'

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
 * This function merges the global `limit` configuration with the per-route
 *
 * @param path - pathname from event
 * @param config - The module configuration containing global and per-route settings.
 * @returns The merged rate limit configuration for the route.
 */
export function getRouteLimit(path: string, config: ModuleOptions): LimitConfiguration {
  return Object.assign({}, config.limit, config.routes?.find(route =>
    typeof route !== 'string' && route.path === path,
  ) ?? {})
}

/**
 * Checks route path has a custom per-route limit defined.
 * @param path - pathname to check.
 * @param config - The module configuration containing route definitions.
 * @returns True if a matching custom route limit exists, false otherwise.
 */
export function hasRouteLimit(path: string, config: ModuleOptions): boolean {
  return config.routes?.find(route =>
    typeof route !== 'string' && route.path === path,
  ) !== undefined
}
