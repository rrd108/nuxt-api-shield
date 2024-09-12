import {
  createError,
  defineEventHandler,
  getRequestIP,
  useRuntimeConfig,
  useStorage,
} from "#imports";
import type { RateLimit } from "../types/RateLimit";
import { isBanExpired } from "../utils/isBanExpired";
import shieldLog from "../utils/shieldLog";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig().public.nuxtApiShield;
  const url = event.node.req.url;

  if (!url?.startsWith("/api/") || (config.routes?.length && !config.routes.some(route => url.startsWith(route)))) {
    return;
  }


  // console.log(
  // `👉 Handling request for URL: ${url} from IP: ${getRequestIP(event, { xForwardedFor: true }) || "unKnownIP"
  //   }`
  // );

  const shieldStorage = useStorage("shield");
  const requestIP = getRequestIP(event, { xForwardedFor: true }) || "unKnownIP";

  if (!(await shieldStorage.hasItem(`ip:${requestIP}`))) {
    // console.log("  IP not found in storage, setting initial count.", requestIP);
    return await shieldStorage.setItem(`ip:${requestIP}`, {
      count: 1,
      time: Date.now(),
    });
  }

  const req = (await shieldStorage.getItem(`ip:${requestIP}`)) as RateLimit;
  req.count++;
  // console.log(`  Set count for IP ${requestIP}: ${req.count}`);

  shieldLog(req, requestIP, url);

  if (!isRateLimited(req)) {
    // console.log("  Request not rate-limited, updating storage.");
    return await shieldStorage.setItem(`ip:${requestIP}`, {
      count: req.count,
      time: req.time,
    });
  }

  // console.log("  Request is rate-limited.");

  if (isBanExpired(req)) {
    // console.log("  Ban expired, resetting count.");
    return await shieldStorage.setItem(`ip:${requestIP}`, {
      count: 1,
      time: Date.now(),
    });
  }

  // console.log("  setItem for IP:", requestIP, "with count:", req.count, "and time:", req.time);
  shieldStorage.setItem(`ip:${requestIP}`, {
    count: req.count,
    time: req.time,
  });

  await banDelay(req);

  const options = useRuntimeConfig().public.nuxtApiShield;

  if (options.retryAfterHeader) {
    // console.log("  Setting Retry-After header", req.count + 1);
    event.node.res.setHeader("Retry-After", req.count + 1); // and extra second is added
  }

  //console.error("Throwing 429 error");
  throw createError({
    statusCode: 429,
    message: options.errorMessage,
  });
});

const isRateLimited = (req: RateLimit) => {
  const options = useRuntimeConfig().public.nuxtApiShield;

  // console.log(`  count: ${req.count} <= limit: ${options.limit.max}`);
  if (req.count <= options.limit.max) {
    return false;
  }
  // console.log("  ", (Date.now() - req.time) / 1000, "<", options.limit.duration);
  return (Date.now() - req.time) / 1000 < options.limit.duration;
};

const banDelay = async (req: RateLimit) => {
  const options = useRuntimeConfig().public.nuxtApiShield;
  // console.log("  delayOnBan is: " + options.delayOnBan);
  if (options.delayOnBan && req.count > options.limit.max) {
    // INFO Nuxt Devtools will send a new request if the response is slow,
    // so we get the count incremented twice or more times, based on the ban delay time
    // console.log(`  Applying ban delay for ${(req.count - options.limit.max) * options.limit.ban} sec (${Date.now()})`);
    await new Promise((resolve) =>
      setTimeout(resolve, (req.count - options.limit.max) * options.limit.ban * 1000)
    );
    // console.log(`  Ban delay completed (${Date.now()})`);
  }
};
