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
      // @ts-expect-error: Nitro storage configuration is not fully typed in this test environment
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
    }
    catch (error: unknown) {
      const err = error as { statusCode?: number, response?: { status?: number }, status?: number, data?: { message?: string }, message?: string, statusMessage?: string }
      const statusCode = err.statusCode || err.response?.status || err.status
      expect(statusCode).toBe(429)
      // Check the actual error message instead of statusMessage
      const message = err.data?.message || err.message || err.statusMessage
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

    // Add initial delay to ensure server is fully ready
    await new Promise(resolve => setTimeout(resolve, 1000));

    // First, try a simple known working route to verify server is responsive
    try {
      const basicResponse = await $fetch('/api/users/123/profile', {
        method: 'GET',
        retryStatusCodes: [],
      })
      expect(basicResponse).toHaveProperty('result')
    } catch (error) {
      throw new Error(`Basic route test failed - server may not be ready: ${error}`)
    }

    // Now test the multi-segment routes
    try {
      const response = await $fetch('/api/reports/monthly/2023/summary', {
        method: 'GET',
        retryStatusCodes: [],
      })

      // Verify we got JSON response with expected structure
      if (typeof response !== 'object') {
        // Check if we got HTML response (indicating 404)
        if (typeof response === 'string' && response.includes('<!DOCTYPE html>')) {
          throw new Error(`Received HTML response instead of JSON. This usually indicates the route doesn't exist or server isn't ready. Response preview: ${response.substring(0, 200)}...`)
        }
        throw new TypeError(`Expected object data, but got ${typeof response}: ${JSON.stringify(response)}`)
      }

      const monthlyResponse = response as { result: string }
      expect(monthlyResponse).toHaveProperty('result')
      expect(monthlyResponse.result).toBe('Report Summary')
    }
    catch (error: unknown) {
      // If it's our custom error, just rethrow it
      if (error instanceof Error && (error.message.startsWith('Expected object data') || error.message.startsWith('Expected object response') || error.message.includes('Received HTML response'))) {
        throw error
      }
      // If the initial request fails, provide detailed error information
      const err = error as { message?: string, data?: unknown, statusCode?: number, response?: { status?: number, _data?: unknown, headers?: { get: (n: string) => string } }, status?: number }
      const errorMessage = err.message || 'Unknown error'
      const errorData = err.data || err.response?._data || 'No error data'
      const statusCode = err.statusCode || err.response?.status || err.status || 'Unknown status'
      const contentType = err.response?.headers?.get('content-type') || 'Unknown content-type'

      throw new Error(`Failed to access /api/reports/monthly/2023/summary: ${errorMessage} (Status: ${statusCode}, Content-Type: ${contentType}) Data: ${JSON.stringify(errorData)}`)
    }

    // Add a longer delay to ensure proper timing
    await new Promise(resolve => setTimeout(resolve, 500))

    try {
      const response = await $fetch('/api/reports/annual/summary', {
        method: 'GET',
        retryStatusCodes: [],
      })

      // Verify we got JSON response with expected structure
      if (typeof response !== 'object') {
        // Check if we got HTML response (indicating 404)
        if (typeof response === 'string' && response.includes('<!DOCTYPE html>')) {
          throw new Error(`Received HTML response for annual summary instead of JSON. Response preview: ${response.substring(0, 200)}...`)
        }
        throw new TypeError(`Expected object data for annual, but got ${typeof response}: ${JSON.stringify(response)}`)
      }

      const annualResponse = response as { result: string }
      expect(annualResponse).toHaveProperty('result')
      expect(annualResponse.result).toBe('Annual Report Summary')
    }
    catch (error: unknown) {
      // If it's our custom error, just rethrow it
      if (error instanceof Error && (error.message.startsWith('Expected object data') || error.message.startsWith('Expected object response') || error.message.includes('Received HTML response'))) {
        throw error
      }
      const err = error as { message?: string, data?: unknown, statusCode?: number, response?: { status?: number, _data?: unknown, headers?: { get: (n: string) => string } }, status?: number }
      const errorMessage = err.message || 'Unknown error'
      const errorData = err.data || err.response?._data || 'No error data'
      const statusCode = err.statusCode || err.response?.status || err.status || 'Unknown status'
      const contentType = err.response?.headers?.get('content-type') || 'Unknown content-type'

      throw new Error(`Failed to access /api/reports/annual/summary: ${errorMessage} (Status: ${statusCode}, Content-Type: ${contentType}) Data: ${JSON.stringify(errorData)}`)
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
    }
    catch (error: unknown) {
      // Handle different error structures
      const err = error as { statusCode?: number, response?: { status?: number }, status?: number, data?: { message?: string } | string, message?: string, statusMessage?: string }
      const statusCode = err.statusCode || err.response?.status || err.status
      expect(statusCode).toBe(429)

      // Also check that we're not getting HTML error pages
      const message = (typeof err.data === 'object' ? err.data?.message : null) || err.message || err.statusMessage
      expect(message).toContain('Too Many Requests')

      // Additional check to ensure we're not getting HTML responses
      if (typeof err.data === 'string' && err.data.startsWith('<!DOCTYPE')) {
        throw new Error('Received HTML error page instead of JSON response')
      }
    }
  })
})
