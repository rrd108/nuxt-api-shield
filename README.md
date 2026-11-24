# Nuxt API Shield

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]

Rate limiting and IP banning for the `/api/` routes of your Nuxt app.

When one IP address sends too many requests to an API route, Nuxt API Shield bans that IP for a while and answers its requests with `429 Too Many Requests`. It stores its counters in any [unstorage](https://unstorage.unjs.io) driver (memory, filesystem, Redis ...), can write ban events for [fail2ban](#fail2ban), and ships cleanup tasks so the storage does not grow forever.

- [Release notes](/CHANGELOG.md)
- Coming from v1? See [Upgrading from v1](#upgrading-from-v1).

## Contents

- [Quick start](#quick-start)
- [How it works](#how-it-works)
- [Configuration](#configuration)
  - [Where to put the options](#where-to-put-the-options)
  - [All options](#all-options)
- [Choosing which routes are protected](#choosing-which-routes-are-protected)
- [Storage](#storage)
- [Cleanup tasks](#cleanup-tasks)
- [Behind a proxy or CDN](#behind-a-proxy-or-cdn)
- [Logging and fail2ban](#logging-and-fail2ban)
- [TypeScript](#typescript)
- [Upgrading from v1](#upgrading-from-v1)
- [Security and privacy notes](#security-and-privacy-notes)
- [Development](#development)

## Quick start

**1. Install**

```bash
npm install nuxt-api-shield   # or: yarn add / pnpm add nuxt-api-shield
```

**2. Configure** `nuxt.config.ts`

```ts
export default defineNuxtConfig({
  modules: ['nuxt-api-shield'],

  nuxtApiShield: {
    limit: {
      max: 12,       // requests allowed ...
      duration: 108, // ... per this many seconds
      ban: 3600,     // seconds an IP is banned after going over the limit
    },
  },

  nitro: {
    // Where the counters and bans are kept. The name must be "shield".
    storage: {
      shield: { driver: 'fs', base: '.shield' },
    },
    // Remove expired bans and old counters on a schedule
    experimental: { tasks: true },
    scheduledTasks: {
      '*/15 * * * *': ['shield:cleanBans'],
      '0 0 * * *': ['shield:cleanIpData'],
    },
  },
})
```

That's it: every route under `/api/` is now protected with 12 requests per 108 seconds per IP. Every option is optional, so `nuxtApiShield` only needs the values you want to change from the [defaults](#all-options).

**3. Check it**

```bash
for i in $(seq 1 14); do curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/hello; done
```

The first 12 requests get `200`, the 13th and every request after it get `429` until the ban ends.

> Running more than one server instance? Use [Redis](#storage) instead of `fs`. Behind nginx, Cloudflare or a load balancer? Read [Behind a proxy or CDN](#behind-a-proxy-or-cdn), otherwise every visitor looks like the same IP.

## How it works

For every request the shield goes through these steps:

1. **Only `/api/` paths.** Pages, assets and anything outside `/api/` are never touched.
2. **Skip routes.** If the path matches `skipRoutes`, the request goes through untouched.
3. **Route rules.** The path is matched against `routes`. With no `routes` configured, every `/api/` path is protected with the global `limit`. With `routes` configured, paths that match none of them are not protected.
4. **Ban check.** If the IP is banned, the request gets `429` straight away.
5. **Counting.** The request is counted in the IP's window for that route. The window starts at the IP's first request and lasts `duration` seconds. Request number `max + 1` inside the window gets `429` and starts a ban of `ban` seconds.

Two things to keep in mind:

- **Counters are per IP and per route.** `/api/login` and `/api/products` each have their own counter. Paths that match the same [wildcard rule](#wildcard-rules) share one counter.
- **A ban is per IP, for every protected route.** An IP banned on `/api/login` is also refused on `/api/products` until the ban ends. Routes in `skipRoutes` and routes outside your `routes` list stay reachable.

### What the client sees

Every protected response carries these headers:

| Header | Meaning |
|---|---|
| `X-RateLimit-Limit` | `max` for this route |
| `X-RateLimit-Remaining` | requests left in the current window |
| `X-RateLimit-Reset` | Unix time (seconds) when the window or the ban ends |
| `Retry-After` | seconds until the ban ends, only on `429` and only with `retryAfterHeader: true` |

A rejected request gets status `429` and a JSON body:

```json
{ "error": "Too Many Requests", "retryAfter": 3600 }
```

`error` is your `errorMessage`, `retryAfter` is the number of seconds until the ban ends. With `delayOnBan: true` (the default) the `429` is sent after an extra second, to slow down scripts.

## Configuration

### Where to put the options

You can set the options in three places. Use one of them.

**In `nuxt.config.ts`** under the `nuxtApiShield` key, as in the [quick start](#quick-start).

**In a separate file**, `.config/nuxt-api-shield.ts` (following the [`.config` directory convention](https://github.com/pi0/config-dir)). `nuxt-api-shield.config.ts` at the project root works too, as do `.js`, `.mjs` and `.json`. `nuxt dev` restarts when the file changes.

```ts
// .config/nuxt-api-shield.ts
import { defineShieldConfig } from 'nuxt-api-shield/config'

export default defineShieldConfig({
  limit: { max: 10, duration: 60, ban: 600 },
  routes: ['/api/login'],
})
```

**In `runtimeConfig.nuxtApiShield`** in `nuxt.config.ts`. This is mainly useful because Nuxt lets you override runtime config with environment variables when the app starts, for example:

```bash
NUXT_NUXT_API_SHIELD_LIMIT_MAX=20
NUXT_NUXT_API_SHIELD_STORAGE_KEY_PREFIX=staging:
```

> Per-route limits in `routes` are worked out at build time, so an environment variable for `limit` changes the global limit but not routes that were already given their limit from it.

If an option is set in more than one place, the higher one in this list wins:

1. `runtimeConfig.nuxtApiShield`
2. the `nuxtApiShield` key
3. the config file
4. the defaults

Objects (`limit`, `log`, `security`) are merged key by key. Arrays (`routes`, `skipRoutes`) are not merged: the highest place that sets one wins whole. If you set options both under `nuxtApiShield` and in the config file you get a warning at build time.

The final options live in the server-only runtime config (`useRuntimeConfig().nuxtApiShield`) and are never sent to the browser.

### All options

| Option | Default | What it does |
|---|---|---|
| `limit.max` | `12` | Requests an IP may send to one route within `duration`. |
| `limit.duration` | `108` | Length of the counting window, in seconds. |
| `limit.ban` | `3600` | How long an IP is banned after going over `max`, in seconds. |
| `routes` | `[]` | Which `/api/` routes to protect, optionally with their own limits. Empty means all of them. See [Choosing which routes are protected](#choosing-which-routes-are-protected). |
| `skipRoutes` | `[]` | `/api/` paths the shield ignores completely. Supports `*` and `**`. |
| `delayOnBan` | `true` | Wait one second before sending a `429`. |
| `errorMessage` | `"Too Many Requests"` | The `error` field of the `429` body. |
| `retryAfterHeader` | `false` | Add a `Retry-After` header to `429` responses. |
| `ipTTL` | `604800` (7 days) | The `shield:cleanIpData` task deletes counters older than this many seconds. `0` turns that cleanup off. |
| `storageKeyPrefix` | `""` | Put in front of every storage key, to keep several apps apart in one Redis. See [Sharing one storage between apps](#sharing-one-storage-between-apps). |
| `security.trustXForwardedFor` | `false` | Read the client IP from the `X-Forwarded-For` header. Only turn on behind a proxy, see [Behind a proxy or CDN](#behind-a-proxy-or-cdn). |
| `security.trustedProxyHops` | `1` | How many of your own proxies add to `X-Forwarded-For`. |
| `log.path` | `""` | Folder for log files. Empty turns logging off. |
| `log.attempts` | `0` | Log every request from an IP once its count in the window reaches this number. `0` turns it off. |
| `log.fail2ban` | `false` | Write a fail2ban-friendly line for every ban event. Needs `log.path`. |

## Choosing which routes are protected

Without `routes`, every `/api/` route gets the global `limit`. That is a good start for most apps. Use `routes` when you want to protect only some routes, or give some of them a stricter limit.

> As soon as `routes` has an entry, **only** the routes it matches are protected. To protect everything and make a few routes stricter, add a catch-all rule such as `'/api'`.

### Route rules

Each entry in `routes` is a string or an object:

```ts
nuxtApiShield: {
  limit: { max: 60, duration: 60, ban: 600 },

  routes: [
    // A string: this path and everything below it, with the global limit
    '/api',

    // An object: its own limit (any of max, duration, ban; the rest come from `limit`)
    { path: '/api/login', max: 5, duration: 60, ban: 3600 },

    // A wildcard rule
    { path: '/api/users/*/avatar', pattern: true, max: 10, duration: 60 },
  ],
}
```

Here `/api/login` allows 5 tries a minute, avatar uploads 10 a minute for all users together, and every other `/api/` route 60 a minute.

A plain `path` (no `pattern: true`) matches that path and everything below it on a `/` boundary: `'/api/v2'` matches `/api/v2` and `/api/v2/users`, but not `/api/v20`. A trailing slash is ignored, so `'/api/v2/'` is the same rule as `'/api/v2'`.

### Wildcard rules

Add `pattern: true` to use wildcards:

- `*` matches exactly one path segment: `/api/users/*/profile` matches `/api/users/42/profile`.
- `**` matches any number of segments, including none: `/api/reports/**/summary` matches `/api/reports/summary` and `/api/reports/2026/03/summary`.

All paths that match one wildcard rule **share one counter** per IP. Patterns that are too broad, such as `/**`, `/*` or `/api*`, stop the build with an error naming the rule, so a route never ends up unprotected by accident.

### When several rules match

1. A rule whose path is exactly the request path wins.
2. Otherwise the most specific matching wildcard rule wins (fewer wildcards, and `*` before `**`).
3. Otherwise the longest matching plain path wins, so `/api/login` beats `/api`.

### Skipping routes

`skipRoutes` lists `/api/` paths the shield ignores completely: no counting, no ban check, no logging. Use it for health checks, webhooks and monitoring probes. It accepts exact paths and the same `*` / `**` wildcards (no `pattern: true` needed).

```ts
nuxtApiShield: {
  skipRoutes: [
    '/api/health',
    '/api/webhooks/stripe',
    '/api/_internal/**',
  ],
}
```

`skipRoutes` is checked first, so a skipped path stays reachable even for a banned IP.

## Storage

The shield keeps its data in the Nitro storage named **`shield`**. If you don't configure it, the module warns at build time and uses memory, so all counters and bans are lost on every restart.

```ts
nitro: {
  storage: {
    shield: { driver: 'fs', base: '.shield' },                      // one server
    // shield: { driver: 'redis', host: 'localhost', port: 6379 },  // production
  },
},
```

Any [unstorage driver](https://unstorage.unjs.io/drivers) works. Which one to pick:

| | `memory` / `fs` | Redis |
|---|---|---|
| Several server instances | Each instance counts on its own, so the real limit is `max` × instances. | One shared count. |
| Many requests at once | Two requests can read the same count at the same moment and both get through. | Fine for most traffic. Not strictly atomic either, since the shield reads, then writes. |
| Cleanup | The cleanup tasks list every key, which gets slow with a lot of data. | Same tasks, but Redis handles large key sets much better. |

`memory` and `fs` are fine for development and a single, low-traffic server. For anything else use Redis ([driver options](https://unstorage.unjs.io/drivers/redis)).

### What is stored

| Key | Value |
|---|---|
| `ip:<path>:<ip>` | `{ count, time }`: requests in the current window and when the window started |
| `ban:<ip>` | the time the ban ends, in milliseconds |

Storage drivers turn `/` in keys into `:`, so the counter for `/api/login` shows up as `ip:api:login:<ip>`. The `:` in IPv6 addresses is stored as `_`.

### Sharing one storage between apps

Two apps (or staging and production) that use the same Redis share counters and bans unless you give each its own `storageKeyPrefix`:

```ts
nuxtApiShield: {
  storageKeyPrefix: 'myapp:', // keys become myapp:ip:... and myapp:ban:...
}
```

End the prefix with a colon: it is added as is, so `'myapp'` gives `myappip:...`. To use a different prefix per environment, set `NUXT_NUXT_API_SHIELD_STORAGE_KEY_PREFIX`.

The cleanup tasks only touch keys under the app's own prefix. If you change the prefix of a running app, delete the keys under the old prefix by hand.

## Cleanup tasks

Expired bans and old counters stay in storage until something deletes them. The module comes with two [Nitro tasks](https://nitro.build/guide/tasks) for that:

- `shield:cleanBans` deletes bans that have ended.
- `shield:cleanIpData` deletes counters older than `ipTTL` seconds (7 days by default), and any broken entries.

Turn on Nitro tasks and schedule them:

```ts
nitro: {
  experimental: { tasks: true },
  scheduledTasks: {
    '*/15 * * * *': ['shield:cleanBans'], // every 15 minutes
    '0 0 * * *': ['shield:cleanIpData'],  // every day at midnight
  },
},
```

The cron times are only examples. You don't need any files in `server/tasks/` for this.

**Your own cleanup logic.** To add logging, metrics or a different storage layout, write your own task under a **different name** and schedule that one instead. The bundled tasks in [`src/runtime/server/tasks/shield/`](src/runtime/server/tasks/shield/) are short and make a good starting point; `isActualBanTimestampExpired` is auto-imported on the server for checking ban values. A project task with the same name as a bundled one may replace it, so avoid `shield:cleanBans` and `shield:cleanIpData` unless that is what you want.

## Behind a proxy or CDN

By default the shield uses the IP address of the connection. Behind nginx, Cloudflare, a load balancer or most hosting platforms, that is the proxy's address, so **all visitors share one counter** and one busy visitor can get everyone banned.

The real client IP is then in the `X-Forwarded-For` header. Tell the shield to read it:

```ts
nuxtApiShield: {
  security: {
    trustXForwardedFor: true,
    trustedProxyHops: 1, // number of your own proxies in front of the app
  },
}
```

Each proxy adds the address it received the request from to the end of `X-Forwarded-For`. Anything at the start of the header may have been sent by the client and can be faked, so the shield counts `trustedProxyHops` entries from the **right**:

- One proxy (nginx with `$proxy_add_x_forwarded_for`, an AWS ALB ...): `trustedProxyHops: 1`.
- Two proxies (a CDN in front of nginx): `trustedProxyHops: 2`.

If the chosen entry is not a valid IP address, the shield falls back to the connection's IP.

> **Only turn on `trustXForwardedFor` behind a proxy you control.** If the app can be reached directly, anyone can send a made-up `X-Forwarded-For` header and get a fresh counter for every request, or get someone else banned.

## Logging and fail2ban

Logging is off by default. Set `log.path` to a folder to turn it on. The shield writes one file per day there (`shield-YYYYMMDD.log`), every 5 seconds.

Two kinds of lines can be written:

- **Busy IPs**, with `log.attempts`: every request from an IP once its count in the window reaches that number.

  ```
  192.168.1.100 - (8) - 2026-06-21T12:34:56.789Z - http://example.com/api/login
  ```

- **Ban events**, with `log.fail2ban: true`: one line each time a request is refused because of a ban.

  ```
  2026-06-21 12:34:56,789 nuxt-api-shield ban 192.168.1.100 — http://example.com/api/login exceeded limit (12 requests in 108s)
  ```

### fail2ban

[fail2ban](https://github.com/fail2ban/fail2ban) can read the ban lines and block the IP in the firewall, so the requests never reach Node.

**1.** Turn on the ban lines:

```ts
nuxtApiShield: {
  log: {
    path: '/var/log/nuxt-api-shield',
    fail2ban: true,
  },
}
```

**2.** Create `/etc/fail2ban/filter.d/nuxt-api-shield.conf`:

```ini
[Definition]
failregex = ^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2},\d{3} nuxt-api-shield ban <HOST>
```

**3.** Add a jail to `/etc/fail2ban/jail.local`:

```ini
[nuxt-api-shield]
enabled   = true
filter    = nuxt-api-shield
logpath   = /var/log/nuxt-api-shield/shield-*.log
port      = http,https
banaction = iptables-multiport
maxretry  = 1
findtime  = 1
bantime   = 3600
```

The shield has already decided to ban, so `maxretry = 1` makes fail2ban act on the first line. Set `bantime` to at least your `limit.ban`.

**4.** Restart fail2ban:

```bash
sudo systemctl restart fail2ban
```

The fail2ban service must be able to read the log folder.

## TypeScript

```ts
import type { ModuleOptions, RateLimit, ResolvedShieldConfig } from 'nuxt-api-shield'
```

- `ModuleOptions`: the options as you write them, all optional.
- `ResolvedShieldConfig`: the final options with every default filled in. This is what `useRuntimeConfig().nuxtApiShield` holds on the server.
- `RateLimit`: a stored counter, `{ count: number, time: number }`.

For example, to read the counter of one IP in a server route or task:

```ts
import type { RateLimit } from 'nuxt-api-shield'

const entry = await useStorage('shield').getItem<RateLimit>('ip:api:login:192.168.1.1')
if (entry) {
  console.log(`${entry.count} requests since ${new Date(entry.time).toISOString()}`)
}
```

## Upgrading from v1

Go through these steps in order. Steps 1 to 4 apply to everyone coming from v1.0; if you are already on v1.1 most of them are done. The [changelog](/CHANGELOG.md) has the background for each change.

**1. Use Node 22.12 or later** (or Node 24). Older Node versions are no longer supported.

**2. Move the options out of the public runtime config.** v2 stops the build if `runtimeConfig.public.nuxtApiShield` is set, because Nuxt sends the public runtime config to every browser.

```ts
// Before
runtimeConfig: {
  public: {
    nuxtApiShield: { limit: { max: 10 } },
  },
},

// After: use the nuxtApiShield key (or runtimeConfig.nuxtApiShield, or the config file)
nuxtApiShield: { limit: { max: 10 } },
```

**3. Rename your environment variables** from `NUXT_PUBLIC_NUXT_API_SHIELD_*` to `NUXT_NUXT_API_SHIELD_*`, for example `NUXT_PUBLIC_NUXT_API_SHIELD_LIMIT_MAX` becomes `NUXT_NUXT_API_SHIELD_LIMIT_MAX`. The old names are ignored now.

**4. Update your own cleanup tasks**, if you have any in `server/tasks/`. Read the options from the private runtime config:

```ts
// Before
const config = useRuntimeConfig().public.nuxtApiShield
// After
const config = useRuntimeConfig().nuxtApiShield
```

If you only scheduled `shield:cleanBans` and `shield:cleanIpData` without your own task files, there is nothing to do.

**5. Check `trustedProxyHops` if you use `trustXForwardedFor`.** The client IP is now read from the right end of `X-Forwarded-For` instead of the left, because the left end can be faked by the client. With one proxy in front of the app the default `1` is right. With two (for example a CDN in front of nginx) set `security.trustedProxyHops: 2`. See [Behind a proxy or CDN](#behind-a-proxy-or-cdn).

**6. Keep `routes` and `skipRoutes` in one place.** v1 joined these lists when you set them both in `runtimeConfig.nuxtApiShield` and under `nuxtApiShield`. v2 uses only the `runtimeConfig` one. If you had them in both, merge them into one list.

**7. Fix any wildcard route the build complains about.** A `pattern: true` route that is too broad (such as `/**` or `/api*`) used to be skipped silently, leaving that route unprotected. Now the build stops with an error naming the route. Make the pattern more specific, see [Wildcard rules](#wildcard-rules).

**8. Look at routes written with a trailing slash.** In v1, `routes: ['/api/v2/']` or `skipRoutes: ['/api/health/']` matched nothing. In v2 they work like `'/api/v2'` and `'/api/health'`, so routes you thought were protected (or skipped) now really are. Check that this is what you want.

**9. Optional: move the options to `.config/nuxt-api-shield.ts`**, typed with `defineShieldConfig`. See [Where to put the options](#where-to-put-the-options). Don't keep them both there and under `nuxtApiShield`.

**TypeScript:** every field of `ModuleOptions` is optional now. If you read `useRuntimeConfig().nuxtApiShield` in your own code, type it as `ResolvedShieldConfig`, which has every default filled in.

## Security and privacy notes

- **IP addresses are personal data** under laws like the GDPR. The shield stores them (see [What is stored](#what-is-stored)), so mention it in your privacy policy. Schedule the [cleanup tasks](#cleanup-tasks) so they are not kept longer than needed; `ipTTL` sets how long counters are kept.
- **Protect the storage.** With the `fs` driver, keep the storage folder and the log folder out of anything your web server serves, and give them strict file permissions. With Redis, use authentication and keep it off the public network.
- **`errorMessage` is sent as is.** Use plain text. If you put HTML in it, your client must escape it before showing it.

## Development

```bash
yarn              # install dependencies
yarn dev:prepare  # generate type stubs
yarn dev          # run the playground
yarn dev:build    # build the playground
yarn lint         # ESLint
yarn test         # Vitest and type checks
yarn test:watch
```

Releases: `yarn release:patch`, `yarn release:minor` or `yarn release:major`.

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/nuxt-api-shield/latest.svg?style=flat&colorA=020420&colorB=00DC82
[npm-version-href]: https://npmjs.com/package/nuxt-api-shield
[npm-downloads-src]: https://img.shields.io/npm/dm/nuxt-api-shield.svg?style=flat&colorA=020420&colorB=00DC82
[npm-downloads-href]: https://npmjs.com/package/nuxt-api-shield
[license-src]: https://img.shields.io/npm/l/nuxt-api-shield.svg?style=flat&colorA=020420&colorB=00DC82
[license-href]: https://npmjs.com/package/nuxt-api-shield
[nuxt-src]: https://img.shields.io/badge/Nuxt-020420?logo=nuxt.js
[nuxt-href]: https://nuxt.com
