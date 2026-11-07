import { fileURLToPath } from 'node:url'
import { rm } from 'node:fs/promises'
import { describe, it, expect, beforeEach } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'

beforeEach(async () => {
  // workaround to clean the storage, see withroutes.test.ts
  const storagePath = fileURLToPath(new URL('../_testEncodedPathShield', import.meta.url))
  await rm(storagePath, { recursive: true, force: true })
})

const statusOf = (path: string) =>
  $fetch(path, { method: 'GET', retryStatusCodes: [] })
    .then(() => 200)
    .catch((err: { statusCode: number }) => err.statusCode)

describe('shield with percent-encoded and trailing-slash path variants', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/encodedpath', import.meta.url)),
  })

  it('counts encoded variants against the same route counter', async () => {
    expect(await statusOf('/%61pi/v3/example?c=1/1')).toBe(200)
    expect(await statusOf('/api/v%33/example/?c=1/2')).toBe(200)
    // limit.max = 2, so the third request, sent un-encoded, must be rejected
    expect(await statusOf('/api/v3/example?c=1/3')).toBe(429)
  })

  it('rejects a banned IP on encoded variants of the path', async () => {
    expect(await statusOf('/api/v3/example?c=2/1')).toBe(200)
    expect(await statusOf('/api/v3/example?c=2/2')).toBe(200)
    expect(await statusOf('/api/v3/example?c=2/3')).toBe(429)
    expect(await statusOf('/%61pi/v3/example?c=2/4')).toBe(429)
    expect(await statusOf('/api/v3/ex%61mple?c=2/5')).toBe(429)
  })
})
