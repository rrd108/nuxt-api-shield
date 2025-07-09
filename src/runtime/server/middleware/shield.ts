import type { RateLimit } from '../types/RateLimit'
import shieldLog from '../utils/shieldLog'
import {
  createError,
  defineEventHandler,
  getRequestIP,
  getRequestURL,
  useRuntimeConfig,
  useStorage,
} from '#imports'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig().public.nuxtApiShield
  const url = getRequestURL(event)

  if (!url?.pathname?.startsWith('/api/') || (config.routes?.length && !config.routes.some(route => url.pathname?.startsWith(route)))) {
    return
  }

  // console.log(
  // `👉 Handling request for URL: ${url} from IP: ${getRequestIP(event, { xForwardedFor: true }) || "unKnownIP"
  //   }`
  // );

  const shieldStorage = useStorage('shield')
  // Determine whether to trust X-Forwarded-For header based on config.
  // The module's default for `config.security.trustXForwardedFor` is true.
  const trustXForwardedFor = config.security?.trustXForwardedFor;

  const requestIP = getRequestIP(event, { xForwardedFor: trustXForwardedFor }) || 'unKnownIP'

  const banKey = `ban:${requestIP}`
  const bannedUntilRaw = await shieldStorage.getItem(banKey)
  const bannedUntil = typeof bannedUntilRaw === 'number' ? bannedUntilRaw : Number(bannedUntilRaw)
  if (bannedUntilRaw && !Number.isNaN(bannedUntil) && Date.now() < bannedUntil) {
    if (config.retryAfterHeader) {
      const retryAfter = Math.ceil((bannedUntil - Date.now()) / 1000)
      event.node.res.setHeader('Retry-After', retryAfter)
    }
    throw createError({
      statusCode: 429,
      message: config.errorMessage,
    })
  }
  else if (bannedUntilRaw && !Number.isNaN(bannedUntil) && Date.now() >= bannedUntil) {
    // Ban expired, remove ban and reset IP count
    await shieldStorage.removeItem(banKey)
    // When a ban expires, we reset the IP's rate limit data as if it's a new IP.
    // This ensures that the count doesn't carry over from before the ban.
    await shieldStorage.setItem(`ip:${requestIP}`, { count: 1, time: Date.now() })
    // Note: The request that triggers this ban removal is counted as the first request in the new window.
    // Thus, we don't 'return' here but proceed to process this request.
  }

  // IP Rate Limiting Logic
  const ipKey = `ip:${requestIP}`
  let currentRateLimitData = (await shieldStorage.getItem(ipKey)) as RateLimit | null
  const currentTime = Date.now()

  if (!currentRateLimitData) {
    // First request from this IP (or first after a ban was just cleared above)
    currentRateLimitData = { count: 1, time: currentTime }
  }
  else {
    // Existing IP, check if window needs reset
    if ((currentTime - currentRateLimitData.time) / 1000 >= config.limit.duration) {
      // Window expired, reset
      currentRateLimitData.count = 1
      currentRateLimitData.time = currentTime
    }
    else {
      // Window still active, increment count
      currentRateLimitData.count++
    }
  }

  const req = currentRateLimitData // This is the state *after* accounting for the current request

  shieldLog(req, requestIP, url.toString()) // Log the current state

  if (isRateLimited(req)) { // isRateLimited now checks if this current state (req) warrants a ban
    const banUntilTimestamp = Date.now() + config.limit.ban * 1000
    await shieldStorage.setItem(banKey, banUntilTimestamp)
    // When a user is banned, their IP tracking data should also be reset
    // so that after the ban, they start with a fresh count.
    await shieldStorage.setItem(ipKey, { count: 1, time: Date.now() })

    if (config.retryAfterHeader) {
      event.node.res.setHeader('Retry-After', config.limit.ban) // Duration of ban in seconds
    }

    // console.error("Throwing 429 error due to rate limit ban");
    throw createError({
      statusCode: 429,
      message: config.errorMessage,
    })
  }
  else {
    // Not banned, just update the storage with the new count/time
    await shieldStorage.setItem(ipKey, {
      count: req.count,
      time: req.time,
    })
    // Request is allowed, proceed to the actual API handler
    return
  }
})

const isRateLimited = (req: RateLimit) => { // req here is the state *after* current request is counted
  const options = useRuntimeConfig().public.nuxtApiShield
  // If count is over limit AND it happened within the duration since req.time
  if (req.count > options.limit.max) {
    // Check if these excess requests occurred within the defined duration
    // from the start of the current window (req.time)
    return (Date.now() - req.time) / 1000 < options.limit.duration
  }
  return false // Count is not over max, so not rate limited
}
    event.node.res.setHeader('Retry-After', config.limit.ban)
  }

  // console.error("Throwing 429 error");
  throw createError({
    statusCode: 429,
    message: config.errorMessage,
  })
})

const isRateLimited = (req: RateLimit) => {
  const options = useRuntimeConfig().public.nuxtApiShield

  // console.log(`  count: ${req.count} <= limit: ${options.limit.max}`);
  if (req.count <= options.limit.max) {
    return false
  }
  // console.log("  ", (Date.now() - req.time) / 1000, "<", options.limit.duration);
  return (Date.now() - req.time) / 1000 < options.limit.duration
}
