import { createError } from 'h3'
import type { H3Event } from 'h3'
import type { ModuleOptions, LimitConfiguration } from '../../type'
import type { Storage } from 'nitropack'
import type { RateLimit } from '../types/RateLimit'
import shieldLog from './shieldLog'

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

  await shieldLog(updatedState, requestIP, url)

  // Check if the new count triggers a rate limit
  if (newCount > routeLimit.max) {
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

  // Update the count for the current duration
  await shieldStorage.setItem(ipKey, updatedState)
}
