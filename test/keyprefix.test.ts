import { fileURLToPath } from 'node:url'
import { rm } from 'node:fs/promises'
import { beforeEach, describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'

describe('storageKeyPrefix', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/keyprefix', import.meta.url)),
  })

  beforeEach(async () => {
    const storagePath = fileURLToPath(new URL('../_testKeyPrefixShield', import.meta.url))
    await rm(storagePath, { recursive: true, force: true })
  })

  it('stores rate limit and ban keys under the configured prefix', async () => {
    await $fetch('/api/example', { retryStatusCodes: [] })
    // limit.max = 1, so the 2nd request bans the IP
    await expect($fetch('/api/example', { retryStatusCodes: [] })).rejects.toThrowError()

    const keys = await $fetch<string[]>('/debug/keys')
    expect(keys.length).toBe(2)
    expect(keys.some(key => key.startsWith('myapp:ip:'))).toBe(true)
    expect(keys.some(key => key.startsWith('myapp:ban:'))).toBe(true)
  })

  it('shield:cleanBans only removes expired bans under the configured prefix', async () => {
    const expired = Date.now() - 1000
    await $fetch('/debug/seed', {
      method: 'POST',
      body: {
        'myapp:ban:1.1.1.1': expired,
        'ban:2.2.2.2': expired, // another app sharing the storage
      },
    })

    await $fetch('/debug/task?name=shield:cleanBans', { method: 'POST' })

    const keys = await $fetch<string[]>('/debug/keys')
    expect(keys).toEqual(['ban:2.2.2.2'])
  })

  it('shield:cleanIpData only removes stale IP entries under the configured prefix', async () => {
    const stale = { count: 1, time: Date.now() - 8 * 24 * 60 * 60 * 1000 } // older than the default 7 day ipTTL
    await $fetch('/debug/seed', {
      method: 'POST',
      body: {
        'myapp:ip:/api/example:1.1.1.1': stale,
        'ip:/api/example:2.2.2.2': stale, // another app sharing the storage
      },
    })

    await $fetch('/debug/task?name=shield:cleanIpData', { method: 'POST' })

    const keys = await $fetch<string[]>('/debug/keys')
    expect(keys).toEqual(['ip:api:example:2.2.2.2'])
  })
})
