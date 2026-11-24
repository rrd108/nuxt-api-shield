import { defineEventHandler } from 'h3'
import { useStorage } from 'nitropack/runtime'

// Outside /api/ so the shield never rate limits it.
export default defineEventHandler(async () => {
  return await useStorage('shield').getKeys()
})
