import { describe, it, expect } from 'vitest'
import type { RateLimit } from 'nuxt-api-shield'

describe('types', () => {
  it('should be able to import RateLimit type', () => {
    const rateLimit: RateLimit = {
      count: 0,
      time: 0,
    }
    expect(rateLimit.count).toBe(0)
  })
})
