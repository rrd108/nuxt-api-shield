import type { H3Event } from 'h3'

/**
 * Returns the request path exactly as the h3/Nitro router sees it.
 *
 * `event.path` is already percent-decoded by h3 (with `%2F` kept encoded), so
 * `/%61pi/login` and `/api/logi%6E` both become `/api/login`. Using the raw URL
 * instead would let encoded variants slip past route matching and the ban check
 * while still reaching the same handler.
 *
 * The query string is cut at the first `?` (as the router does, which also
 * covers a decoded `%3F`), and trailing slashes are removed so `/api/login/`
 * shares a counter with `/api/login`.
 */
export const normalizePath = (event: H3Event): string => {
  let path = event.path || '/'

  const queryIndex = path.indexOf('?')
  if (queryIndex !== -1) {
    path = path.slice(0, queryIndex)
  }

  path = path.replace(/\/+$/, '')

  return path || '/'
}
