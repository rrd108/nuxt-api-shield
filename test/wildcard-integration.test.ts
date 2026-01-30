import { fileURLToPath } from 'node:url'
import { rm } from 'node:fs/promises'
import { describe, it, expect, beforeEach } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'

beforeEach(async () => {
  // Clean test storage
  const storagePath = fileURLToPath(new URL('../_testWildcardIntegrationShield', import.meta.url))
  await rm(storagePath, { recursive: true, force: true })
  
  // Also clean the other storage path that might be used
  const storagePath2 = fileURLToPath(new URL('../_testWildcardShield', import.meta.url))
  await rm(storagePath2, { recursive: true, force: true })
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
    await new Promise(resolve => setTimeout(resolve, 200))

    // Second request should succeed
    response = await $fetch('/api/users/456/profile', {
      method: 'GET',
      retryStatusCodes: [],
    })
    expect(response).toHaveProperty('result')

    // Wait a bit more
    await new Promise(resolve => setTimeout(resolve, 200))

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
      // Add delay between requests to avoid timing issues
      if (i < 4) await new Promise(resolve => setTimeout(resolve, 100))
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
      // Add delay between requests to avoid timing issues
      if (i < 2) await new Promise(resolve => setTimeout(resolve, 100))
    }
  })

  it('should handle multi-segment wildcard patterns', async () => {
    // Should match /api/reports/monthly/2023/summary
    // and /api/reports/annual/summary
    
    // First, verify the routes exist and return expected content
    try {
      const monthlyResponse = await $fetch('/api/reports/monthly/2023/summary', {
        method: 'GET',
        retryStatusCodes: [],
      })
      
      // Verify we got JSON response with expected structure
      expect(monthlyResponse).toBeDefined()
      expect(typeof monthlyResponse).toBe('object')
      expect(monthlyResponse).toHaveProperty('result')
      expect(monthlyResponse.result).toBe('Report Summary')
    } catch (error: any) {
      // If the initial request fails, provide detailed error information
      const errorMessage = error.message || 'Unknown error'
      const errorData = error.data || 'No error data'
      const statusCode = error.statusCode || error.response?.status || error.status || 'Unknown status'
      
      throw new Error(`Failed to access /api/reports/monthly/2023/summary: ${errorMessage} (Status: ${statusCode}) Data: ${JSON.stringify(errorData)}`)
    }

    // Add a longer delay to ensure proper timing
    await new Promise(resolve => setTimeout(resolve, 500))

    try {
      const annualResponse = await $fetch('/api/reports/annual/summary', {
        method: 'GET',
        retryStatusCodes: [],
      })
      
      // Verify we got JSON response with expected structure
      expect(annualResponse).toBeDefined()
      expect(typeof annualResponse).toBe('object')
      expect(annualResponse).toHaveProperty('result')
      expect(annualResponse.result).toBe('Annual Report Summary')
    } catch (error: any) {
      const errorMessage = error.message || 'Unknown error'
      const errorData = error.data || 'No error data'
      const statusCode = error.statusCode || error.response?.status || error.status || 'Unknown status'
      
      throw new Error(`Failed to access /api/reports/annual/summary: ${errorMessage} (Status: ${statusCode}) Data: ${JSON.stringify(errorData)}`)
    }

    // Add another longer delay
    await new Promise(resolve => setTimeout(resolve, 500))

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
      
      // Also check that we're not getting HTML error pages
      const message = error.data?.message || error.message || error.statusMessage || error.response?.statusText
      expect(message).toContain('Too Many Requests')
      
      // Additional check to ensure we're not getting HTML responses
      if (typeof error.data === 'string' && error.data.startsWith('<!DOCTYPE')) {
        throw new Error('Received HTML error page instead of JSON response')
      }
    }
  })
})