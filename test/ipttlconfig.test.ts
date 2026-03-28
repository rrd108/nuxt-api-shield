import { fileURLToPath } from 'node:url'
import { rm } from 'node:fs/promises'
import { beforeEach, describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'
import type { ApiResponse } from './ApiResponse'

describe('ipTTL config options', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/ipttlconfig', import.meta.url)),
  })

  beforeEach(async () => {
    const storagePath = fileURLToPath(new URL('../_testIpTTLConfig', import.meta.url))
    await rm(storagePath, { recursive: true, force: true })
  })

  it('should respond to api call with new config', async () => {
    const response = await $fetch('/api/test', {
      method: 'GET',
      retryStatusCodes: [],
    })
    expect((response as ApiResponse).name).toBe('test')
  })

  it('should have ipTTL config available in runtime', async () => {
    const response = await $fetch<{ ipTTL: number }>('/api/debug-config', {
      method: 'GET',
      retryStatusCodes: [],
    })
    expect(response.ipTTL).toBe(3600)
  })

  it('should have security.trustXForwardedFor config available in runtime', async () => {
    const response = await $fetch<{ security: { trustXForwardedFor: boolean } }>('/api/debug-config', {
      method: 'GET',
      retryStatusCodes: [],
    })
    expect(response.security).toEqual({ trustXForwardedFor: true })
  })
})
