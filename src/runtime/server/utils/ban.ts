import type { H3Event } from 'h3'
import type { ModuleOptions, LimitConfiguration } from '../../type'
import type { Storage } from 'nitropack'
import { shieldLogBan } from './shieldLog'
import { setRateLimitHeaders } from './rateLimit'

export const checkBan = async (
  event: H3Event,
  shieldStorage: Storage,
  banKey: string,
  config: ModuleOptions,
  requestIP?: string,
  url?: string,
  routeLimit?: LimitConfiguration,
): Promise<boolean | 'banned'> => {
  const bannedUntilRaw = await shieldStorage.getItem(banKey)
  if (!bannedUntilRaw) {
    return false
  }

  const bannedUntil = typeof bannedUntilRaw === 'number' ? bannedUntilRaw : Number(bannedUntilRaw)
  if (Number.isNaN(bannedUntil)) {
    return false
  }

  if (Date.now() < bannedUntil) {
    const limit = routeLimit ?? config.limit
    setRateLimitHeaders(event, limit.max, 0, Math.ceil(bannedUntil / 1000))

    if (config.retryAfterHeader) {
      const retryAfter = Math.ceil((bannedUntil - Date.now()) / 1e3)
      event.node.res.setHeader('Retry-After', retryAfter)
    }
    if (requestIP && url) {
      shieldLogBan(requestIP, url, limit, config.log)
    }
    if (config.delayOnBan) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    const retryAfter = Math.ceil((bannedUntil - Date.now()) / 1e3)
    event.node.res.statusCode = 429
    event.node.res.setHeader('Content-Type', 'application/json')
    event.node.res.end(JSON.stringify({ error: config.errorMessage, retryAfter }))
    return 'banned'
  }

  return true // Ban expired
}
