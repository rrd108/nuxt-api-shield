import { defineEventHandler, readBody } from 'h3'
import { useStorage } from 'nitropack/runtime'

export default defineEventHandler(async (event) => {
  const items = await readBody<Record<string, number | { count: number, time: number }>>(event)
  const storage = useStorage('shield')
  for (const [key, value] of Object.entries(items)) {
    await storage.setItem(key, value)
  }
  return { ok: true }
})
