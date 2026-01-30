import { fileURLToPath } from 'node:url'
import { rm } from 'node:fs/promises'
import { describe, it, expect, beforeEach } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'

beforeEach(async () => {
  // Clean test storage
  const storagePath = fileURLToPath(new URL('../_testWildcardDebugShield', import.meta.url))
  await rm(storagePath, { recursive: true, force: true })
})

describe('simple wildcard test', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/wildcard', import.meta.url)),
    nuxtConfig: {
      // @ts-ignore
      nitro: {
        storage: {
          shield: {
            driver: 'fs',
            base: '_testWildcardDebugShield',
          },
        },
      },
    },
  })

  it('should show storage state', async () => {
    // Make a few requests
    await $fetch('/api/users/123/profile', { method: 'GET', retryStatusCodes: [] })
    await new Promise(resolve => setTimeout(resolve, 100))
    await $fetch('/api/users/456/profile', { method: 'GET', retryStatusCodes: [] })
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Check storage state
    const storageData = await $fetch('/api/debug/storage')
    console.log('Storage data:', JSON.stringify(storageData, null, 2))
    
    // This should trigger rate limiting
    try {
      await $fetch('/api/users/789/profile', { method: 'GET', retryStatusCodes: [] })
      expect.fail('Should have been rate limited')
    } catch (error: any) {
      console.log('Final error:', error)
      expect(error.statusCode || error.response?.status || error.status).toBe(429)
    }
  })
})