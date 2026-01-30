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
  extractRoutePaths,
  getRouteLimit,
  hasRouteLimit,
  findBestMatchingRoute,
} from '../utils/routes'
import createKey from '../utils/createKey'
import { validatePattern } from '../utils/patternMatcher'

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

  // Check if there's a matching route configuration (exact or wildcard)
  const hasMatchingRoute = hasRouteLimit(url.pathname, config)
  console.log('Has matching route:', hasMatchingRoute)
  
  // If no route configuration exists and we have route configurations defined,
  // check if any patterns might match (for backward compatibility)
  if (!hasMatchingRoute && config.routes?.length) {
    const routePaths = extractRoutePaths(config.routes)
    const hasStringMatch = routePaths.some(path => url.pathname.startsWith(path))
    console.log('String matches:', hasStringMatch)
    
    // Check for wildcard pattern matches
    const hasPatternMatch = config.routes.some(route => {
      if (typeof route === 'string') return false
      return route.pattern === true && 
             validatePattern(route.path) && 
             findBestMatchingRoute(url.pathname, config) !== null
    })
    console.log('Pattern matches:', hasPatternMatch)
    
    if (!hasStringMatch && !hasPatternMatch) {
      console.log('No matching routes found, skipping')
      return
    }
  }

  console.log('Processing rate limiting for:', url.pathname)

  const shieldStorage = useStorage('shield')
  const requestIP = getRequestIP(event, { xForwardedFor: true }) || 'unKnownIP'
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
  const isRouteLimit = hasRouteLimit(url?.pathname, config)
  
  // For wildcard patterns, use the pattern as the storage key so all matching paths share the same counter
  let storagePath: string | undefined = undefined
  if (isRouteLimit) {
    const matchingRoute = findBestMatchingRoute(url.pathname, config)
    if (matchingRoute && 'pattern' in matchingRoute && matchingRoute.pattern === true) {
      // Use the pattern as storage key for wildcard routes
      storagePath = matchingRoute.path
    } else {
      // Use the actual path for exact matches
      storagePath = url?.pathname
    }
  }

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
