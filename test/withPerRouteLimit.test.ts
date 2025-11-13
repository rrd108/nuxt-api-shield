import { fileURLToPath } from 'node:url'
import { rm } from 'node:fs/promises'
import { describe, it, expect, beforeEach } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'
import type { ApiResponse } from './ApiResponse'

describe('shield with /api/example-specific-limit route', async () => {
  beforeEach(async () => {
    const storagePath = fileURLToPath(new URL('../_testWithRoutesLimiteShield', import.meta.url))
    await rm(storagePath, { recursive: true, force: true })
  })

  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/withPerRouteLimit', import.meta.url)),
  })

  it('respond to api call 1 times (limit.max, limit.duration) and rejects the 2nd call', async () => {
    /**
     * Make a request to default limited route
     */
    await $fetch('/api/example?c=1/1', {
      method: 'GET',
      retryStatusCodes: [],
    })

    const response = await $fetch('/api/example-specific-limit?c=1/2', {
      method: 'GET',
      retryStatusCodes: [],
    })
    expect((response as ApiResponse).name).toBe('Radha')

    try {
      // as limit.max = 1, this should throw 429 and ban for 2 seconds (limit.ban)
      // this limit is defined in route configuration
      await expect(async () =>
        $fetch('/api/example-specific-limit?c=2/2', { method: 'GET', retryStatusCodes: [] }),
      ).rejects.toThrowError()
    }
    catch (err) {
      const typedErr = err as { statusCode: number, statusMessage: string }
      console.log(err)
      expect(typedErr.statusCode).toBe(429)
      expect(typedErr.statusMessage).toBe('Leave me alone')
    }
  })
})
