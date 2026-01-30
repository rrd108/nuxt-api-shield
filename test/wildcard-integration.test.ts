import { fileURLToPath } from 'node:url'
import { rm } from 'node:fs/promises'
import { describe, it, expect, beforeEach } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'

beforeEach(async () => {
  // Clean test storage
  const storagePath = fileURLToPath(new URL('../_testWildcardIntegrationShield', import.meta.url))
  await rm(storagePath, { recursive: true, force: true })
})

describe('wildcard route matching', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/wildcard', import.meta.url)),
    nuxtConfig: {
      // @ts-ignore
      nitro: {
        storage: {
          shield: {
            driver: 'fs',
            base: '_testWildcardIntegrationShield',
          },
        },
      },
    },
  })

  it('should apply wildcard limits to matching routes', async () => {
    // First request should succeed
    let response = await $fetch('/api/users/123/profile', {
      method: 'GET',
      retryStatusCodes: [],
    })
    expect(response).toHaveProperty('result')

    // Wait a bit to ensure proper timing
    await new Promise(resolve => setTimeout(resolve, 100))

    // Second request should succeed
    response = await $fetch('/api/users/456/profile', {
      method: 'GET',
      retryStatusCodes: [],
    })
    expect(response).toHaveProperty('result')

    // Wait a bit more
    await new Promise(resolve => setTimeout(resolve, 100))

    // Third request should be rate limited
    try {
      await $fetch('/api/users/789/profile', {
        method: 'GET',
        retryStatusCodes: [],
      })
      expect.fail('Should have thrown 429 error')
    } catch (error: any) {
      const statusCode = error.statusCode || error.response?.status || error.status
      expect(statusCode).toBe(429)
      // Check the actual error message instead of statusMessage
      const message = error.data?.message || error.message || error.statusMessage || error.response?.statusText
      expect(message).toContain('Too Many Requests')
    }
  })

  it('should not apply wildcard limits to non-matching routes', async () => {
    // These should use default limits (higher than wildcard limit)
    for (let i = 0; i < 5; i++) {
      const response = await $fetch(`/api/posts/${i}`, {
        method: 'GET',
        retryStatusCodes: [],
      })
      expect(response).toHaveProperty('result')
    }
  })

  it('should prioritize exact matches over wildcard matches', async () => {
    // Exact match route should use its own limits, not wildcard limits
    for (let i = 0; i < 3; i++) {
      const response = await $fetch('/api/admin/special', {
        method: 'GET',
        retryStatusCodes: [],
      })
      expect(response).toHaveProperty('result')
    }
  })

  it('should handle multi-segment wildcard patterns', async () => {
    // Should match /api/reports/monthly/2023/summary
    // and /api/reports/annual/summary
    let response = await $fetch('/api/reports/monthly/2023/summary', {
      method: 'GET',
      retryStatusCodes: [],
    })
    expect(response).toHaveProperty('result')

    response = await $fetch('/api/reports/annual/summary', {
      method: 'GET',
      retryStatusCodes: [],
    })
    expect(response).toHaveProperty('result')

    // Third match should be rate limited
    try {
      await $fetch('/api/reports/quarterly/summary', {
        method: 'GET',
        retryStatusCodes: [],
      })
      expect.fail('Should have thrown 429 error')
    } catch (error: any) {
      // Handle different error structures
      const statusCode = error.statusCode || error.response?.status || error.status
      expect(statusCode).toBe(429)
    }
  })
})