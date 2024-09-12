import type { RateLimit } from '../types/RateLimit'
import { useRuntimeConfig } from '#imports'

export const isBanExpired = (req: RateLimit) => {
  const options = useRuntimeConfig().public.nuxtApiShield
  // console.log(
  //   "Checking if ban is expired for IP:",
  //   req,
  //   "with :",
  //   (Date.now() - req.time) / 1000,
  //   " > ",
  //   options.limit.ban
  // );
  return (Date.now() - req.time) / 1000 > options.limit.ban
}
