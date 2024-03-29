import { defineEventHandler, getRequestIP } from "h3";
import { createError, useRuntimeConfig, useStorage } from "#imports";

interface RateLimit {
  count: number;
  time: number;
}

export default defineEventHandler(async (event) => {
  if (!event.node.req.url?.startsWith("/api/")) {
    return;
  }

  const shieldStorage = useStorage("shield");
  const requestIP = getRequestIP(event, { xForwardedFor: true });

  if (!(await shieldStorage.hasItem(`ip:${requestIP}`))) {
    return await shieldStorage.setItem(`ip:${requestIP}`, {
      count: 1,
      time: Date.now(),
    });
  }

  const req = await shieldStorage.getItem(`ip:${requestIP}`);

  if (isNotRateLimited(req)) {
    return await shieldStorage.setItem(`ip:${requestIP}`, {
      count: req.count + 1,
      time: req.time,
    });
  }

  if (isBanExpired(req)) {
    return await shieldStorage.setItem(`ip:${requestIP}`, {
      count: 1,
      time: Date.now(),
    });
  }

  throw createError({
    statusCode: 429,
    statusMessage: "Too Many Requests",
  });
});

const isNotRateLimited = (req: RateLimit) => {
  const options = useRuntimeConfig().public.nuxtApiShield;
  return (
    req.count <= options.limit.max &&
    (Date.now() - req.time) / 1000 <= options.limit.duration
  );
};

const isBanExpired = (req: RateLimit) => {
  const options = useRuntimeConfig().public.nuxtApiShield;
  return (Date.now() - req.time) / 1000 > options.limit.ban;
};
