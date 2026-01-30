import { describe, it, expect } from 'vitest'
import { findBestMatchingRoute } from '../src/runtime/server/utils/routes'
import type { ModuleOptions } from '../src/type'

describe('route matching debug', () => {
  it('should find correct matching routes', () => {
    const config: ModuleOptions = {
      limit: { max: 10, duration: 60, ban: 30 },
      delayOnBan: false,
      errorMessage: 'Too Many Requests',
      retryAfterHeader: false,
      routes: [
        {
          path: '/api/users/*/profile',
          pattern: true,
          max: 2,
        },
        {
          path: '/api/admin/special',
          max: 5,
        },
      ],
    }

    // Test exact match
    const exactMatch = findBestMatchingRoute('/api/admin/special', config)
    console.log('Exact match:', exactMatch)
    expect(exactMatch).toBeDefined()
    expect(exactMatch?.max).toBe(5)

    // Test wildcard match
    const wildcardMatch = findBestMatchingRoute('/api/users/123/profile', config)
    console.log('Wildcard match:', wildcardMatch)
    expect(wildcardMatch).toBeDefined()
    expect(wildcardMatch?.max).toBe(2)

    // Test non-match
    const noMatch = findBestMatchingRoute('/api/posts/123', config)
    console.log('No match:', noMatch)
    expect(noMatch).toBeNull()
  })
})
