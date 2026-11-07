import { isIP } from 'node:net'
import type { H3Event } from 'h3'
import { UNKNOWN_IP } from './constants'

export type ClientIPOptions = {
  trustXForwardedFor?: boolean
  trustedProxyHops?: number
}

const validIP = (value: string | undefined): string | undefined => {
  const ip = value?.trim()
  return ip && isIP(ip) ? ip : undefined
}

/**
 * Pick the client IP from X-Forwarded-For, counting `hops` entries from the right.
 *
 * Proxies append the address they received the request from, so only the
 * rightmost entries are written by infrastructure you control. The leftmost
 * entry is whatever the client sent and must not be trusted. With one proxy in
 * front of the app (hops = 1) the client IP is the last entry; with two proxies
 * (e.g. CDN -> nginx -> app) it is the second-to-last, and so on.
 */
export const pickForwardedIP = (header: string | undefined, hops: number): string | undefined => {
  if (!header) return undefined
  const entries = header.split(',').map(entry => entry.trim()).filter(Boolean)
  const index = entries.length - Math.max(1, Math.floor(hops))
  if (index < 0) return undefined
  return validIP(entries[index])
}

/**
 * Resolve the client IP for rate limiting.
 *
 * Only returns syntactically valid IP addresses, so attacker-controlled header
 * values can never reach storage keys or the fail2ban log. Falls back to the
 * socket address when X-Forwarded-For is not trusted, missing or invalid.
 */
export const getClientIP = (event: H3Event, options: ClientIPOptions = {}): string => {
  const contextIP = validIP(event.context.clientAddress)
  if (contextIP) return contextIP

  if (options.trustXForwardedFor) {
    const header = event.node.req.headers['x-forwarded-for']
    const forwarded = pickForwardedIP(
      Array.isArray(header) ? header.join(',') : header,
      options.trustedProxyHops ?? 1,
    )
    if (forwarded) return forwarded
  }

  return validIP(event.node.req.socket?.remoteAddress) || UNKNOWN_IP
}
