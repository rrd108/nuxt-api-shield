import { defineEventHandler } from 'h3'
import { useStorage } from 'nitropack/runtime/internal/storage'

export default defineEventHandler(async (event: any) => {
  const storage = useStorage('shield')
  const keys = await storage.getKeys()
  const data: Record<string, any> = {}
  
  for (const key of keys) {
    data[key] = await storage.getItem(key)
  }
  
  return {
    keys,
    data,
    time: Date.now()
  }
})