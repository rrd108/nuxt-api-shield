import { describe, it, expect } from 'vitest'
import type { RateLimit } from '../dist/runtime/server/types/RateLimit'

describe('types', () => {
  it('should be able to import RateLimit type', () => {
    const rateLimit: RateLimit = {
      count: 0,
      time: 0,
    }
    expect(rateLimit.count).toBe(0)
  })
})
