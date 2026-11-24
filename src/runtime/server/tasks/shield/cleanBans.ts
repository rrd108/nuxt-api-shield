import { isActualBanTimestampExpired } from '../../utils/isActualBanTimestampExpired'
import { defineTask, useRuntimeConfig, useStorage } from 'nitropack/runtime'
import type { ResolvedShieldConfig } from '../../../../type'

export default defineTask({
  meta: {
    name: 'shield:cleanBans',
    description: 'Clean expired bans from nuxt-api-shield storage.',
  },
  async run() {
    const shieldStorage = useStorage('shield')
    const storageKeyPrefix = (useRuntimeConfig().nuxtApiShield as ResolvedShieldConfig).storageKeyPrefix
    // Only fetch this app's ban keys (`<storageKeyPrefix>ban:`)
    const banKeys = await shieldStorage.getKeys(`${storageKeyPrefix}ban:`)

    let cleanedCount = 0
    for (const key of banKeys) {
      const bannedUntilRaw = await shieldStorage.getItem(key)
      if (isActualBanTimestampExpired(bannedUntilRaw)) {
        await shieldStorage.removeItem(key)
        cleanedCount++
      }
    }
    console.log(`[nuxt-api-shield] Cleaned ${cleanedCount} expired ban(s).`)
    return { result: { cleanedCount } }
  },
})
