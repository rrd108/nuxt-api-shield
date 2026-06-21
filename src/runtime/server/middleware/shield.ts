import { defineEventHandler, getRequestURL, getRequestIP } from 'h3'
import { useRuntimeConfig, useStorage } from 'nitropack/runtime'
import type { ModuleOptions } from '../../../type'
import {
  getRouteLimit,
  findBestMatchingRoute,
} from '../utils/routes'
import { matchesPattern } from '../utils/patternMatcher'
import createKey from '../utils/createKey'
import { UNKNOWN_IP } from '../utils/constants'
import { checkBan } from '../utils/ban'
import { handleRateLimit } from '../utils/rateLimit'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig().public.nuxtApiShield as ModuleOptions
  const url = getRequestURL(event)

  // Check if this is an API route
  if (!url?.pathname?.startsWith('/api/')) {
    return
  }

  // Check if this route should be skipped
  if (config.skipRoutes?.length) {
    for (const route of config.skipRoutes) {
      if (matchesPattern(route, url.pathname)) {
        return
      }
    }
  }

  // Find the best matching route configuration
  const matchingRoute = findBestMatchingRoute(url.pathname, config)

  if (!matchingRoute) {
    return
  }

  const shieldStorage = useStorage('shield')
  const trustXForwardedFor = config.security?.trustXForwardedFor ?? false
  const requestIP = getRequestIP(event, { xForwardedFor: trustXForwardedFor })
    || event.node.req?.socket?.remoteAddress
    || UNKNOWN_IP

  // Rate limit config for this route
  const routeLimit = getRouteLimit(url.pathname, config, matchingRoute)

  // Ban check
  const banKey = createKey({
    ipAddress: requestIP,
    prefix: 'ban',
  })

  const isBanExpired = await checkBan(event, shieldStorage, banKey, config, requestIP, url.toString(), routeLimit)

  if (isBanExpired) {
    await shieldStorage.removeItem(banKey)
  }

  // For wildcard patterns, use the pattern as the storage key so all matching paths share the same counter
  const storagePath = ('pattern' in matchingRoute && matchingRoute.pattern === true)
    ? matchingRoute.path
    : url.pathname

  const ipKey = createKey({
    ipAddress: requestIP,
    path: storagePath,
  })

  await handleRateLimit(
    event,
    shieldStorage,
    ipKey,
    banKey,
    requestIP,
    url.toString(),
    routeLimit,
    config,
  )
})
