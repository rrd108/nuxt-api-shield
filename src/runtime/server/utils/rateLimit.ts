import { createError } from 'h3'
import type { H3Event } from 'h3'
import type { ModuleOptions, LimitConfiguration } from '../../type'
import type { Storage } from 'nitropack'
import type { RateLimit } from '../types/RateLimit'
import shieldLog, { shieldLogBan } from './shieldLog'

export const setRateLimitHeaders = (
  event: H3Event,
  limit: number,
  remaining: number,
  reset: number,
) => {
  event.node.res.setHeader('X-RateLimit-Limit', limit)
  event.node.res.setHeader('X-RateLimit-Remaining', Math.max(0, remaining))
  event.node.res.setHeader('X-RateLimit-Reset', reset)
}

/**
 * Handles the rate limiting logic for a specific request.
 * @throws H3Error 429 if the rate limit is exceeded
 */
export const handleRateLimit = async (
  event: H3Event,
  shieldStorage: Storage,
  ipKey: string,
  banKey: string,
  requestIP: string,
  url: string,
  routeLimit: LimitConfiguration,
  config: ModuleOptions,
) => {
  const rateLimitState = await shieldStorage.getItem(ipKey) as RateLimit | null
  const now = Date.now()

  // Check if a new request is outside the duration window
  if (!rateLimitState || (now - rateLimitState.time) / 1000 >= routeLimit.duration) {
    const reset = Math.ceil((now + routeLimit.duration * 1000) / 1000)
    setRateLimitHeaders(event, routeLimit.max, routeLimit.max - 1, reset)
    await shieldStorage.setItem(ipKey, {
      count: 1,
      time: now,
    })
    return
  }

  // Increment the counter for a request within the duration
  const newCount = rateLimitState.count + 1
  const updatedState = {
    count: newCount,
    time: rateLimitState.time,
  }

  shieldLog(updatedState, requestIP, url, config.log)

  const windowEnd = rateLimitState.time + routeLimit.duration * 1000
  const reset = Math.ceil(windowEnd / 1000)

  // Check if the new count triggers a rate limit
  if (newCount > routeLimit.max) {
    setRateLimitHeaders(event, routeLimit.max, 0, reset)

    const banUntil = now + routeLimit.ban * 1e3
    await shieldStorage.setItem(banKey, banUntil)
    await shieldStorage.setItem(ipKey, {
      count: 1,
      time: now,
    })

    shieldLogBan(requestIP, url, routeLimit, config.log)

    if (config.retryAfterHeader) {
      event.node.res.setHeader('Retry-After', routeLimit.ban)
    }

    if (config.delayOnBan) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    throw createError({
      statusCode: 429,
      message: config.errorMessage,
    })
  }

  // Update the count for the current duration
  setRateLimitHeaders(event, routeLimit.max, routeLimit.max - newCount, reset)
  await shieldStorage.setItem(ipKey, updatedState)
}
