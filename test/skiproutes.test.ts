import { fileURLToPath } from 'node:url'
import { rm } from 'node:fs/promises'
import { describe, it, expect, beforeEach } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'
import type { ApiResponse } from './ApiResponse'

const storagePath = fileURLToPath(new URL('../_testSkipRoutesShield', import.meta.url))

beforeEach(async () => {
  await rm(storagePath, { recursive: true, force: true })
})

describe('shield with skipRoutes', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/skiproutes', import.meta.url)),
  })

  it('should not rate-limit requests to skipped routes', async () => {
    let response = await $fetch('/api/health', { method: 'GET', retryStatusCodes: [] })
    expect((response as { status: string }).status).toBe('ok')

    response = await $fetch('/api/health', { method: 'GET', retryStatusCodes: [] })
    expect((response as { status: string }).status).toBe('ok')

    response = await $fetch('/api/health', { method: 'GET', retryStatusCodes: [] })
    expect((response as { status: string }).status).toBe('ok')
  })

  it('should still rate-limit non-skipped routes', async () => {
    await $fetch('/api/example', { method: 'GET', retryStatusCodes: [] })
    await $fetch('/api/example', { method: 'GET', retryStatusCodes: [] })

    const err = await $fetch('/api/example', { method: 'GET', retryStatusCodes: [] })
      .then(() => { throw new Error('Expected 429') })
      .catch((e: unknown) => e as { statusCode: number })
    expect(err.statusCode).toBe(429)
  })

  it('should not increment rate-limit counter on skipped routes', async () => {
    await $fetch('/api/health', { method: 'GET', retryStatusCodes: [] })
    await $fetch('/api/health', { method: 'GET', retryStatusCodes: [] })
    await $fetch('/api/health', { method: 'GET', retryStatusCodes: [] })
    await $fetch('/api/health', { method: 'GET', retryStatusCodes: [] })

    await $fetch('/api/example', { method: 'GET', retryStatusCodes: [] })
    await $fetch('/api/example', { method: 'GET', retryStatusCodes: [] })

    const err = await $fetch('/api/example', { method: 'GET', retryStatusCodes: [] })
      .then(() => { throw new Error('Expected 429') })
      .catch((e: unknown) => e as { statusCode: number })
    expect(err.statusCode).toBe(429)
  })
})
