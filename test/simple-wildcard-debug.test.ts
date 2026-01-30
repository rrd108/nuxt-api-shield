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
      // @ts-expect-error: Nitro storage configuration is not fully typed in this test environment
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
    }
    catch (error: unknown) {
      console.log('Final error:', error)
      const err = error as { statusCode?: number, response?: { status?: number }, status?: number }
      expect(err.statusCode || err.response?.status || err.status).toBe(429)
    }
  })
})
