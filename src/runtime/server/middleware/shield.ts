import {
  getRouteLimit,
  findBestMatchingRoute,
} from '../utils/routes'
import createKey from '../utils/createKey'
import { UNKNOWN_IP } from '../utils/constants'
import { checkBan } from '../utils/ban'
import { handleRateLimit } from '../utils/rateLimit'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig().public.nuxtApiShield as ModuleOptions
  const url = getRequestURL(event)

  // Debug logging
  console.log('Middleware triggered for:', url?.pathname)

  // Check if this is an API route
  if (!url?.pathname?.startsWith('/api/')) {
    return
  }

  // Find the best matching route configuration
  const matchingRoute = findBestMatchingRoute(url.pathname, config)

  if (!matchingRoute) {
    return
  }

  const shieldStorage = useStorage('shield')
  const requestIP = getRequestIP(event, { xForwardedFor: true }) || UNKNOWN_IP

  // Ban check
  const banKey = createKey({
    ipAddress: requestIP,
    prefix: 'ban',
  })

  const isBanExpired = await checkBan(event, shieldStorage, banKey, config)

  if (isBanExpired) {
    await shieldStorage.removeItem(banKey)
  }

  // Rate limit check
  const routeLimit = getRouteLimit(url.pathname, config)

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
