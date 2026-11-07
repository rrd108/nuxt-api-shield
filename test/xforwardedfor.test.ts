import { fileURLToPath } from 'node:url'
import { rm } from 'node:fs/promises'
import { describe, it, expect, beforeEach } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'

beforeEach(async () => {
  // workaround to clean the storage, see withroutes.test.ts
  const storagePath = fileURLToPath(new URL('../_testXForwardedForShield', import.meta.url))
  await rm(storagePath, { recursive: true, force: true })
})

const statusOf = (xForwardedFor: string) =>
  $fetch('/api/example', {
    method: 'GET',
    retryStatusCodes: [],
    headers: { 'X-Forwarded-For': xForwardedFor },
  })
    .then(() => 200)
    .catch((err: { statusCode: number }) => err.statusCode)

describe('shield with trustXForwardedFor behind one proxy', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/xforwardedfor', import.meta.url)),
  })

  it('cannot be bypassed by rotating the client-supplied leftmost entry', async () => {
    expect(await statusOf('1.1.1.1, 203.0.113.7')).toBe(200)
    expect(await statusOf('2.2.2.2, 203.0.113.7')).toBe(200)
    expect(await statusOf('3.3.3.3, 203.0.113.7')).toBe(429)
  })

  it('does not let a client get another IP banned by spoofing it', async () => {
    // attacker spoofs the victim as the leftmost entry; the proxy appends the real address
    expect(await statusOf('198.51.100.9, 203.0.113.66')).toBe(200)
    expect(await statusOf('198.51.100.9, 203.0.113.66')).toBe(200)
    expect(await statusOf('198.51.100.9, 203.0.113.66')).toBe(429)
    // the victim, arriving through the same proxy, is not banned
    expect(await statusOf('198.51.100.9')).toBe(200)
  })
})
