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

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig().public.nuxtApiShield
  const url = getRequestURL(event)
  if (!url?.pathname?.startsWith('/api/')
    || (config.routes?.length && !config.routes.some(route => url.pathname?.startsWith(route)))) {
    return
  }

  const shieldStorage = useStorage('shield')
  const requestIP = getRequestIP(event, { xForwardedFor: true }) || 'unKnownIP'
  const banKey = `ban:${requestIP}`
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

  const ipKey = `ip:${requestIP}`
  const req = await shieldStorage.getItem(ipKey) as RateLimit
  const now = Date.now()

  // Check if a new request is outside the duration window
  if (!req || (now - req.time) / 1000 >= config.limit.duration) {
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
  if (req.count > config.limit.max) {
    const banUntil = now + config.limit.ban * 1e3
    await shieldStorage.setItem(banKey, banUntil)
    await shieldStorage.setItem(ipKey, {
      count: 1,
      time: now,
    })
    if (config.retryAfterHeader) {
      event.node.res.setHeader('Retry-After', config.limit.ban)
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
