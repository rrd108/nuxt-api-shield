import type { RateLimit } from "../types/RateLimit";

const isBanExpired = (req: RateLimit) => {
  const options = useRuntimeConfig().public.nuxtApiShield;
  return (Date.now() - req.time) / 1000 > options.limit.ban;
};

export default isBanExpired;
