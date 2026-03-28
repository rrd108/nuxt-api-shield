import { defineEventHandler } from 'h3'
import { useRuntimeConfig } from 'nitropack/runtime'

export default defineEventHandler(async () => {
  const config = useRuntimeConfig().public.nuxtApiShield
  return {
    ipTTL: config.ipTTL,
    security: config.security,
  }
})
