// Test file to verify RateLimit type imports work correctly
// This tests the direct package import (recommended approach)

// Import from package (direct import - recommended)
import type { RateLimit } from 'nuxt-api-shield'

export default defineEventHandler(async (event) => {
  const shieldStorage = useStorage('shield')
  
  // Test using the RateLimit type
  const testKey = 'ip:127.0.0.1'
  const entry = await shieldStorage.getItem(testKey) as RateLimit | null
  
  if (entry) {
    // TypeScript should recognize these properties
    const count: number = entry.count
    const time: number = entry.time
    
    return {
      success: true,
      message: 'RateLimit type is working correctly',
      entry: {
        count,
        time,
        timestamp: new Date(time).toISOString(),
      },
    }
  }
  
  return {
    success: true,
    message: 'RateLimit type imported successfully (no entry found)',
    type: 'RateLimit type is available and working',
  }
})

