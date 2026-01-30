import shieldLog from '../utils/shieldLog.js'
import {
  createError,
  defineEventHandler,
  getRequestIP,
  getRequestURL,
  useRuntimeConfig,
  useStorage,
} from '#imports'
import type { RateLimit } from '../types/RateLimit'
import type { ModuleOptions } from '../../type'
import {
  getRouteLimit,
  findBestMatchingRoute,
} from '../utils/routes'
import createKey from '../utils/createKey'
import { UNKNOWN_IP } from '../utils/constants'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig().public.nuxtApiShield as ModuleOptions
  const url = getRequestURL(event)

  // Debug logging
  console.log('Middleware triggered for:', url?.pathname)
  console.log('Config routes:', config.routes)

  // Check if this is an API route
  if (!url?.pathname?.startsWith('/api/')) {
    console.log('Not an API route, skipping')
    return
  }

  // Find the best matching route configuration
  const matchingRoute = findBestMatchingRoute(url.pathname, config)
  console.log('Matching route found:', matchingRoute?.path || 'none')

  if (!matchingRoute) {
    console.log('No matching routes found, skipping')
    return
  }

  console.log('Processing rate limiting for:', url.pathname)

  const shieldStorage = useStorage('shield')
  const requestIP = getRequestIP(event, { xForwardedFor: true }) || UNKNOWN_IP
  const banKey = createKey({
    ipAddress: requestIP,
    prefix: 'ban',
  })
  const bannedUntilRaw = await shieldStorage.getItem(banKey)
  const bannedUntil = typeof bannedUntilRaw === 'number' ? bannedUntilRaw : Number(bannedUntilRaw)

  // Check if the user is currently banned
  if (bannedUntilRaw && !Number.isNaN(bannedUntil) && Date.now() < bannedUntil) {
    if (config.retryAfterHeader) {
      const retryAfter = Math.ceil((bannedUntil - Date.now()) / 1e3)
      event.node.res.setHeader('Retry-After', retryAfter)
    }
    throw createError({
      statusCode: 429,
      message: config.errorMessage,
    })
  }
  // Unban the user if the ban has expired
  if (bannedUntilRaw && !Number.isNaN(bannedUntil) && Date.now() >= bannedUntil) {
    await shieldStorage.removeItem(banKey)
  }

  const routeLimit = getRouteLimit(url?.pathname, config)

  // For wildcard patterns, use the pattern as the storage key so all matching paths share the same counter
  const storagePath = ('pattern' in matchingRoute && matchingRoute.pattern === true)
    ? matchingRoute.path
    : url.pathname

  const ipKey = createKey({
    ipAddress: requestIP,
    path: storagePath,
  })

  const req = await shieldStorage.getItem(ipKey) as RateLimit
  const now = Date.now()

  // Check if a new request is outside the duration window
  if (!req || (now - req.time) / 1000 >= routeLimit.duration) {
    // If no record exists, or the duration has expired, reset the counter and timestamp
    await shieldStorage.setItem(ipKey, {
      count: 1,
      time: now,
    })
    return
  }

  // Increment the counter for a request within the duration
  req.count++
  shieldLog(req, requestIP, url.toString())

  // Check if the new count triggers a rate limit
  if (req.count > routeLimit.max) {
    const banUntil = now + routeLimit.ban * 1e3
    await shieldStorage.setItem(banKey, banUntil)
    await shieldStorage.setItem(ipKey, {
      count: 1,
      time: now,
    })
    if (config.retryAfterHeader) {
      event.node.res.setHeader('Retry-After', routeLimit.ban)
    }
    throw createError({
      statusCode: 429,
      message: config.errorMessage,
    })
  }
  else {
    // Update the count for the current duration
    await shieldStorage.setItem(ipKey, {
      count: req.count,
      time: req.time,
    })
  }
})
