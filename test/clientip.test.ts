import { describe, it, expect } from 'vitest'
import { pickForwardedIP } from '../src/runtime/server/utils/getClientIP'

describe('pickForwardedIP', () => {
  it('ignores the client-supplied leftmost entry behind one proxy', () => {
    expect(pickForwardedIP('6.6.6.6, 203.0.113.7', 1)).toBe('203.0.113.7')
  })

  it('counts hops from the right', () => {
    expect(pickForwardedIP('6.6.6.6, 203.0.113.7, 10.0.0.2', 2)).toBe('203.0.113.7')
  })

  it('returns undefined when there are fewer entries than hops', () => {
    expect(pickForwardedIP('203.0.113.7', 2)).toBeUndefined()
  })

  it('accepts IPv6 addresses', () => {
    expect(pickForwardedIP('2001:db8::1', 1)).toBe('2001:db8::1')
  })

  it('rejects values that are not IP addresses', () => {
    expect(pickForwardedIP('evil.example.com', 1)).toBeUndefined()
    expect(pickForwardedIP('1.2.3.4 extra', 1)).toBeUndefined()
    expect(pickForwardedIP('..', 1)).toBeUndefined()
    expect(pickForwardedIP('', 1)).toBeUndefined()
    expect(pickForwardedIP(undefined, 1)).toBeUndefined()
  })

  it('treats hops below 1 as 1', () => {
    expect(pickForwardedIP('6.6.6.6, 203.0.113.7', 0)).toBe('203.0.113.7')
  })
})
