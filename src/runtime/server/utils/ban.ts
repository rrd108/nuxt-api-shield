import { createError } from 'h3'
import type { H3Event } from 'h3'
import type { ModuleOptions, LimitConfiguration } from '../../type'
import type { Storage } from 'nitropack'
import { shieldLogBan } from './shieldLog'

/**
 * Checks if a user is currently banned and handles the response.
 * @returns boolean True if the user was banned but the ban has expired (needs cleanup)
 * @throws H3Error 429 if the user is currently banned
 */
export const checkBan = async (
  event: H3Event,
  shieldStorage: Storage,
  banKey: string,
  config: ModuleOptions,
  requestIP?: string,
  url?: string,
  routeLimit?: LimitConfiguration,
) => {
  const bannedUntilRaw = await shieldStorage.getItem(banKey)
  if (!bannedUntilRaw) {
    return false
  }

  const bannedUntil = typeof bannedUntilRaw === 'number' ? bannedUntilRaw : Number(bannedUntilRaw)
  if (Number.isNaN(bannedUntil)) {
    return false
  }

  if (Date.now() < bannedUntil) {
    if (config.retryAfterHeader) {
      const retryAfter = Math.ceil((bannedUntil - Date.now()) / 1e3)
      event.node.res.setHeader('Retry-After', retryAfter)
    }
    if (requestIP && url) {
      shieldLogBan(requestIP, url, routeLimit ?? config.limit, config.log)
    }
    if (config.delayOnBan) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    throw createError({
      statusCode: 429,
      message: config.errorMessage,
    })
  }

  return true // Ban expired
}
