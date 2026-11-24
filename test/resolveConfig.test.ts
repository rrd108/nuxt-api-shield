import { describe, it, expect } from 'vitest'
import { resolveShieldConfig, SHIELD_DEFAULTS } from '../src/resolveConfig'

describe('resolveShieldConfig', () => {
  it('returns the defaults when no source sets anything', () => {
    const { config, warnings } = resolveShieldConfig({})
    expect(config).toEqual(SHIELD_DEFAULTS)
    expect(warnings).toEqual([])
  })

  it('ranks sources runtimeConfig > inline > file > defaults', () => {
    const { config } = resolveShieldConfig({
      runtimeConfig: { limit: { max: 1 } },
      inline: { limit: { max: 2, duration: 20 } },
      file: { limit: { max: 3, duration: 30, ban: 300 }, errorMessage: 'from file' },
    })
    expect(config.limit).toEqual({ max: 1, duration: 20, ban: 300 })
    expect(config.errorMessage).toBe('from file')
    expect(config.delayOnBan).toBe(SHIELD_DEFAULTS.delayOnBan)
  })

  it('deep-merges nested objects across sources', () => {
    const { config } = resolveShieldConfig({
      inline: { security: { trustXForwardedFor: true } },
      file: { security: { trustedProxyHops: 2 }, log: { path: 'logs' } },
    })
    expect(config.security).toEqual({ trustXForwardedFor: true, trustedProxyHops: 2 })
    expect(config.log).toEqual({ path: 'logs', attempts: 0, fail2ban: false })
  })

  it('takes arrays whole from the highest source instead of concatenating', () => {
    const { config } = resolveShieldConfig({
      inline: { routes: ['/api/inline'], skipRoutes: ['/api/health'] },
      file: { routes: ['/api/file-a', '/api/file-b'], skipRoutes: ['/api/file-skip'] },
    })
    expect(config.routes.map(route => route.path)).toEqual(['/api/inline'])
    expect(config.skipRoutes).toEqual(['/api/health'])
  })

  it('uses a lower source\'s array when higher sources do not set it', () => {
    const { config } = resolveShieldConfig({
      inline: { limit: { max: 5 } },
      file: { routes: ['/api/login'] },
    })
    expect(config.routes.map(route => route.path)).toEqual(['/api/login'])
  })

  it('normalizes routes and merges the global limit into each one', () => {
    const { config } = resolveShieldConfig({
      inline: {
        limit: { max: 10, duration: 60, ban: 30 },
        routes: [
          '/api/plain',
          { path: '/api/custom', max: 2 },
          { path: '/api/users/*/profile', pattern: true, ban: 5 },
        ],
      },
    })
    expect(config.routes).toEqual([
      { path: '/api/plain', pattern: false, max: 10, duration: 60, ban: 30 },
      { path: '/api/custom', pattern: false, max: 2, duration: 60, ban: 30 },
      { path: '/api/users/*/profile', pattern: true, max: 10, duration: 60, ban: 5 },
    ])
  })

  it('throws on an invalid wildcard route, naming the route and the rule', () => {
    expect(() => resolveShieldConfig({
      inline: { routes: [{ path: '/**', pattern: true }] },
    })).toThrowError(/"\/\*\*".*too broad/)
  })

  it('does not validate string routes as patterns', () => {
    expect(() => resolveShieldConfig({ inline: { routes: ['/api'] } })).not.toThrow()
  })

  it('warns when options are split between inline and the Shield config file', () => {
    const { warnings } = resolveShieldConfig({
      inline: { delayOnBan: false },
      file: { limit: { max: 3 } },
    })
    expect(warnings).toHaveLength(1)
    expect(warnings[0]).toMatch(/both inline/)
  })

  it('does not warn for an empty inline object', () => {
    const { warnings } = resolveShieldConfig({ inline: {}, file: { limit: { max: 3 } } })
    expect(warnings).toEqual([])
  })

  it('does not share nested objects with the defaults', () => {
    const { config } = resolveShieldConfig({})
    config.limit.max = 999
    expect(SHIELD_DEFAULTS.limit.max).toBe(12)
  })
})
