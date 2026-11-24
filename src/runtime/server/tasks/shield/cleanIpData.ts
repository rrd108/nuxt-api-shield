import { useStorage, defineTask, useRuntimeConfig } from 'nitropack/runtime'
import type { RateLimit } from '../../types/RateLimit'
import type { ResolvedShieldConfig } from '../../../../type'

export default defineTask({
  meta: {
    name: 'shield:cleanIpData',
    description: 'Clean old IP tracking data from nuxt-api-shield storage.',
  },
  async run() {
    const shieldStorage = useStorage('shield')
    const config = useRuntimeConfig().nuxtApiShield as ResolvedShieldConfig
    const ipTTLseconds = config.ipTTL

    if (ipTTLseconds <= 0) {
      console.log('[nuxt-api-shield] IP data cleanup (ipTTL) disabled.')
      return { result: { cleanedCount: 0 }, status: 'disabled' }
    }

    const ipTTLms = ipTTLseconds * 1000
    // Only fetch this app's IP keys (`<storageKeyPrefix>ip:`)
    const ipKeys = await shieldStorage.getKeys(`${config.storageKeyPrefix}ip:`)
    const currentTime = Date.now()
    let cleanedCount = 0

    for (const key of ipKeys) {
      const entry = await shieldStorage.getItem(key) as RateLimit | null
      if (entry && typeof entry.time === 'number') {
        if ((currentTime - entry.time) > ipTTLms) {
          await shieldStorage.removeItem(key)
          cleanedCount++
        }
      }
      else {
        await shieldStorage.removeItem(key)
        cleanedCount++
      }
    }

    console.log(`[nuxt-api-shield] Cleaned ${cleanedCount} IP entries.`)
    return { result: { cleanedCount } }
  },
})
