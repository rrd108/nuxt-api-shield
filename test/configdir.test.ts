import { fileURLToPath } from 'node:url'
import { rm } from 'node:fs/promises'
import { beforeEach, describe, it, expect } from 'vitest'
import { setup, $fetch, fetch } from '@nuxt/test-utils/e2e'

describe('Shield config file (.config/nuxt-api-shield.ts)', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/configdir', import.meta.url)),
  })

  beforeEach(async () => {
    const storagePath = fileURLToPath(new URL('../_testConfigDirShield', import.meta.url))
    await rm(storagePath, { recursive: true, force: true })
  })

  it('applies the limits from the Shield config file', async () => {
    const first = await $fetch('/api/example', { retryStatusCodes: [] })
    expect(first).toEqual({ name: 'example' })

    // limit.max = 1 comes from the file (the default is 12), so the 2nd request is banned
    const second = await fetch('/api/example')
    expect(second.status).toBe(429)
    expect(await second.json()).toMatchObject({ error: 'Limited by .config/nuxt-api-shield.ts' })
  })
})
