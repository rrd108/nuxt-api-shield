import { fileURLToPath } from 'node:url'
import { readFile, rm } from 'node:fs/promises'
import { beforeEach, describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'
import type { ApiResponse } from './ApiResponse'

// TODO get these from the config
const nuxtConfigBan = 10

describe('shield', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/basic', import.meta.url)),
  })

  beforeEach(async () => {
    // await useStorage("shield").clear(); TODO waiting for https://github.com/nuxt/test-utils/issues/531
    // this is a workaround to clean the storage
    const storagePath = fileURLToPath(new URL('../_testBasicShield', import.meta.url))
    await rm(storagePath, { recursive: true, force: true })
  })

  it('respond to api call 2 times (limit.max, limit.duration) and rejects the 3rd call', async () => {
    // req.count = 1
    let response = await $fetch('/api/basicexample?c=1/1', {
      method: 'GET',
      retryStatusCodes: [],
    })
    expect((response as ApiResponse).name).toBe('Gauranga')

    // req.count = 2
    response = await $fetch('/api/basicexample?c=1/2', {
      method: 'GET',
      retryStatusCodes: [],
    })
    expect((response as ApiResponse).name).toBe('Gauranga')

    try {
      // req.count = 3
      // as limit.max = 2, this should throw 429 and ban for 3 seconds (limit.ban)
      expect(async () =>
        $fetch('/api/basicexample?c=1/3', { method: 'GET', retryStatusCodes: [] }),
      ).rejects.toThrowError()
    }
    catch (err) {
      const typedErr = err as { statusCode: number, statusMessage: string }
      expect(typedErr.statusCode).toBe(429)
      expect(typedErr.statusMessage).toBe('Leave me alone')
    }
  })

  it('respond to the 2nd api call when more then limit.duration time passes', async () => {
    // see #13
    // req.count = 1
    let response = await $fetch('/api/basicexample?c=2/1', {
      method: 'GET',
      retryStatusCodes: [],
    })

    // req.count = 2
    response = await $fetch('/api/basicexample?c=2/2', {
      method: 'GET',
      retryStatusCodes: [],
    })
    expect((response as ApiResponse).name).toBe('Gauranga')
  })

  it('respond to api call after limit.ban expires', async () => {
    // req.count reset here
    await $fetch('/api/basicexample?c=3/1', { method: 'GET', retryStatusCodes: [] }) // req.count = 1
    await $fetch('/api/basicexample?c=3/2', { method: 'GET', retryStatusCodes: [] }) // req.count = 2
    try {
      // req.count = 3
      expect(async () =>
        $fetch('/api/basicexample?c=3/3', { method: 'GET', retryStatusCodes: [] }),
      ).rejects.toThrowError()
    }
    catch (err) {
      const typedErr = err as {
        response: Response
        statusCode: number
        statusMessage: string
      }
      expect(typedErr.statusCode).toBe(429)
      expect(typedErr.statusMessage).toBe('Leave me alone')
      // retry-after = req.count (4) + 2
      expect(typedErr.response.headers.get('Retry-After')).toBe('6')
    }

    // here we should wait for the 3 sec ban to expire
    await new Promise(resolve => setTimeout(resolve, nuxtConfigBan * 1000))
    const response = await $fetch('/api/basicexample?c=3/4', {
      method: 'GET',
      retryStatusCodes: [],
    })
    expect((response as ApiResponse).name).toBe('Gauranga')
  })

  it('should enforce ban period after rate limit duration expires (issue #77)', async () => {
    // 1. Exceed the limit (2 requests in 3 seconds)
    await $fetch('/api/basicexample?c=77/1', { method: 'GET', retryStatusCodes: [] })
    await $fetch('/api/basicexample?c=77/2', { method: 'GET', retryStatusCodes: [] })
    try {
      await $fetch('/api/basicexample?c=77/3', { method: 'GET', retryStatusCodes: [] })
      throw new Error('Nem dobott hibát a 3. kérésnél!')
    } catch (err) {
      const typedErr = err as { statusCode: number, statusMessage: string }
      expect(typedErr.statusCode).toBe(429)
    }

    // 2. Wait after the duration (3 seconds), but still within the ban (10 seconds)
    await new Promise(resolve => setTimeout(resolve, 4000))
    try {
      await $fetch('/api/basicexample?c=77/4', { method: 'GET', retryStatusCodes: [] })
      throw new Error('Nem dobott hibát a ban idő alatt!')
    } catch (err) {
      const typedErr = err as { statusCode: number, statusMessage: string }
      expect(typedErr.statusCode).toBe(429)
    }

    // 3. Wait for the ban to expire (+7 seconds)
    await new Promise(resolve => setTimeout(resolve, 7000))
    const response = await $fetch('/api/basicexample?c=77/5', { method: 'GET', retryStatusCodes: [] })
    expect((response as ApiResponse).name).toBe('Gauranga')
  })
})
