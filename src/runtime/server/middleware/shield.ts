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
import type { ModuleOptions } from '~/src/type'
import {
  extractRoutePaths,
  getRouteLimit,
  hasRouteLimit,
} from '../utils/routes'
import createKey from '../utils/createKey'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig().public.nuxtApiShield as ModuleOptions
  const url = getRequestURL(event)

  /**
   * Get Route limit, if match with configured route its override default limit configuration
   */
  const routeLimit = getRouteLimit(url?.pathname, config)
  const isRouteLimit = hasRouteLimit(url?.pathname, config)
  const routePaths = extractRoutePaths(config.routes || [])
  if (!url?.pathname?.startsWith('/api/')
    || (routePaths.length && !routePaths.some(path => url.pathname.startsWith(path)))) {
    return
  }

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

  const ipKey = createKey({
    ipAddress: requestIP,
    path: isRouteLimit ? url?.pathname : undefined,
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
