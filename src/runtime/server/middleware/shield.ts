import type { RateLimit } from '../types/RateLimit'
import { isBanExpired } from '../utils/isBanExpired'
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
  const requestIP = getRequestIP(event, { xForwardedFor: true }) || 'unKnownIP'

  const banKey = `ban:${requestIP}`
  const bannedUntilRaw = await shieldStorage.getItem(banKey)
  const bannedUntil = typeof bannedUntilRaw === 'number' ? bannedUntilRaw : Number(bannedUntilRaw)
  if (bannedUntilRaw && !isNaN(bannedUntil) && Date.now() < bannedUntil) {
    if (config.retryAfterHeader) {
      const retryAfter = Math.ceil((bannedUntil - Date.now()) / 1000)
      event.node.res.setHeader('Retry-After', retryAfter)
    }
    throw createError({
      statusCode: 429,
      message: config.errorMessage,
    })
  } else if (bannedUntilRaw && !isNaN(bannedUntil) && Date.now() >= bannedUntil) {
    await shieldStorage.removeItem(banKey)
    await shieldStorage.setItem(`ip:${requestIP}`, {
      count: 1,
      time: Date.now(),
    })
  }

  if (!(await shieldStorage.hasItem(`ip:${requestIP}`))) {
    // console.log("  IP not found in storage, setting initial count.", requestIP);
    return await shieldStorage.setItem(`ip:${requestIP}`, {
      count: 1,
      time: Date.now(),
    })
  }

  const req = (await shieldStorage.getItem(`ip:${requestIP}`)) as RateLimit
  req.count++
  // console.log(`  Set count for IP ${requestIP}: ${req.count}`);

  shieldLog(req, requestIP, url.toString())

  if (!isRateLimited(req)) {
    // console.log("  Request not rate-limited, updating storage.");
    return await shieldStorage.setItem(`ip:${requestIP}`, {
      count: req.count,
      time: req.time,
    })
  }

  const banUntil = Date.now() + config.limit.ban * 1000
  await shieldStorage.setItem(banKey, banUntil)
  await shieldStorage.setItem(`ip:${requestIP}`, {
    count: 1,
    time: Date.now(),
  })
  

  if (config.retryAfterHeader) {
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

const banDelay = async (req: RateLimit) => {
  const options = useRuntimeConfig().public.nuxtApiShield
  // console.log("  delayOnBan is: " + options.delayOnBan);
  if (options.delayOnBan && req.count > options.limit.max) {
    // INFO Nuxt Devtools will send a new request if the response is slow,
    // so we get the count incremented twice or more times, based on the ban delay time
    // console.log(`  Applying ban delay for ${(req.count - options.limit.max) * options.limit.ban} sec (${Date.now()})`);
    await new Promise(resolve =>
      setTimeout(resolve, (req.count - options.limit.max) * options.limit.ban * 1000),
    )
    // console.log(`  Ban delay completed (${Date.now()})`);
  }
}
