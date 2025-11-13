# Nuxt API Shield

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]

This Nuxt module implements a rate limiting middleware to protect your API endpoints from excessive requests.

- [✨ &nbsp;Release Notes](/CHANGELOG.md)
  <!-- - [🏀 Online playground](https://stackblitz.com/github/your-org/nuxt-api-shield?file=playground%2Fapp.vue) -->
  - [📖 &nbsp;Documentation](https://github.com/rrd108/nuxt-api-shield)

## Features

- **IP-Based Rate limiting and Brute Force Protection**
  - Tracks and enforces rate limits for individual IP addresses.
  - Prevents malicious actors or excessive requests from a single source from overwhelming your API.
- **Customizable Rate Limits**
  - Configure maximum request count, duration within which the limit applies, and a ban period for exceeding the limit.
  - If the request limit is exceeded, the user is banned for the configured ban period. During the ban period, **all requests are blocked with a 429 error**, regardless of the rate limit window.
  - Add a delay to responses when a user is banned to discourage further abuse (optional).
  - Customize the error message for banned users.
  - Optionally include the `Retry-After` header in responses when a user is banned.
  - Tailor the rate-limiting behavior to align with your API's specific needs and usage patterns.
- **Event-Driven Handling**
  - Intercepts incoming API requests efficiently using Nuxt's event system.
  - Ensures seamless integration with your Nuxt application's request lifecycle.
- **Flexible Storage**
  - Utilizes Nuxt's unstorage abstraction for versatile storage options.
  - Store rate-limiting data in various storage providers (filesystem, memory, databases, etc.) based on your project's requirements.
- **Configurable with Runtime Config**
  - Easily adjust rate-limiting parameters without code changes.
  - Adapt to dynamic needs and maintain control over rate-limiting behavior through Nuxt's runtime configuration.
- **Clear Error Handling**
  - Returns a standardized 429 "Too Many Requests" error response when rate limits are exceeded or when a user is banned.
  - Facilitates proper error handling in client-side applications for a smooth user experience.

## Quick Setup

### 1. Add `nuxt-api-shield` dependency to your project

```bash
# Using pnpm
pnpm add nuxt-api-shield

# Using yarn
yarn add nuxt-api-shield

# Using npm
npm install nuxt-api-shield
```

### 2. Add `nuxt-api-shield` to the `modules` section of `nuxt.config.ts`

You should add only the values you want to use differently from the default values.

```js
export default defineNuxtConfig({
  modules: ["nuxt-api-shield"],
  nuxtApiShield: {
    /*limit: {
      max: 12,        // maximum requests per duration time, default is 12/duration
      duration: 108,   // duration time in seconds, default is 108 seconds
      ban: 3600,      // ban time in seconds, default is 3600 seconds = 1 hour
      // If the request limit is exceeded, the user is banned for this period. During the ban, all requests are blocked with 429.
    },
    delayOnBan: true  // delay every response with +1sec when the user is banned, default is true
    errorMessage: "Too Many Requests",  // error message when the user is banned, default is "Too Many Requests"
    retryAfterHeader: false, // when the user is banned add the Retry-After header to the response, default is false
    log: {
      path: "logs", // path to the log file, every day a new log file will be created, use "" to disable logging
      attempts: 100,    // if an IP reach 100 requests, all the requests will be logged, can be used for further analysis or blocking for example with fail2ban, use 0 to disable logging
    },
    routes: [], // specify routes to apply rate limiting to, default is an empty array meaning all routes are protected.
    // Example:
    // routes: ["/api/v2/", "/api/v3/"], // /api/v1 will not be protected, /api/v2/ and /api/v3/ will be protected */
    ipTTL: 604800, // Optional: Time-to-live in seconds for IP tracking entries (default: 7 days). Set to 0 or negative to disable this specific cleanup.
    security: { // Optional: Security-related configurations
      trustXForwardedFor: true, // Default: true. Whether to trust X-Forwarded-For headers. See warning below.
    }
  },
});
```

**Default Configuration Values:**
(These are applied by the module if not specified in your `nuxtApiShield` config)
```js
{
  limit: {
    max: 12,
    duration: 108, // seconds
    ban: 3600,     // seconds
  },
  delayOnBan: true,
  errorMessage: "Too Many Requests",
  retryAfterHeader: false,
  log: {
    path: "logs", // Logging is disabled if path is empty
    attempts: 100, // Logging per IP is disabled if attempts is 0
  },
  routes: [],
  ipTTL: 7 * 24 * 60 * 60, // 7 days in seconds
  security: {
    trustXForwardedFor: true,
  }
}
```

**Security Warning: `trustXForwardedFor`**

The `security.trustXForwardedFor` option (default is `true`, set by the module) determines if the module uses the `X-Forwarded-For` HTTP header to identify the client's IP address.
- If set to `true`: The module will use the IP address provided in the `X-Forwarded-For` header. This is common when your Nuxt application is behind a trusted reverse proxy, load balancer, or CDN (like Nginx, Cloudflare, AWS ELB/ALB) that correctly sets this header with the real client IP.
- **WARNING:** If `trustXForwardedFor` is `true` and your application is directly internet-facing OR your proxy is not configured to strip incoming `X-Forwarded-For` headers from clients, malicious users can spoof their IP address by sending a fake `X-Forwarded-For` header. This would allow them to bypass rate limits or cause other users to be incorrectly rate-limited.
- If set to `false`: The module will use the direct IP address of the incoming connection (i.e., `event.node.req.socket.remoteAddress`). Use this setting if your application is directly internet-facing or if you are unsure about your proxy's configuration.
- **Recommendation:** Only enable `trustXForwardedFor: true` if you are certain your reverse proxy is correctly configured to set this header and strip any client-sent versions of it. Otherwise, set it to `false`.

### 3. Add `nitro/storage` to `nuxt.config.ts`

You can use any storage you want, but you have to use **shield** as the name of the storage.

```json
{
  "nitro": {
    "storage": {
      "shield": {
        // storage name, you **must** use "shield" as the name
        "driver": "memory"
      }
    }
  }
}
```

If you use for example redis, you can use the following configuration, define the host and port.

```json
{
  "nitro": {
    "storage": {
      "shield": {
        "driver": "redis",
        "host": "localhost",
        "port": 6379,
      }
    }
  }
}
```

### 4. Add Cleanup Task(s) to `nuxt.config.ts`

```json
{
  "nitro": {
    "experimental": {
      "tasks": true
    },
    "scheduledTasks": {
      "*/15 * * * *": ["shield:cleanBans"], // Example: clean expired bans every 15 minutes
      "0 0 * * *": ["shield:cleanIpData"]   // Example: clean old IP data daily at midnight
    }
  }
}
```

### 5. Create your Cleanup Task(s)

It's recommended to clean up expired bans and old IP tracking data regularly to prevent storage bloat and ensure good performance.

#### a) Task for Cleaning Expired Bans

This task removes ban entries (`ban:xxx.xxx.xxx.xxx`) from storage once their ban period has passed.

In `server/tasks/shield/cleanBans.ts` (you can name the file and task as you like):

```ts
import { isActualBanTimestampExpired } from '#imports'; // Auto-imported utility from nuxt-api-shield

export default defineTask({
  meta: {
    name: 'shield:cleanBans', // Match the name in scheduledTasks
    description: 'Clean expired bans from nuxt-api-shield storage.',
  },
  async run() {
    const shieldStorage = useStorage('shield'); // Use your configured storage name

    // Only fetch keys that start with the 'ban:' prefix
    const banKeys = await shieldStorage.getKeys('ban:');

    let cleanedCount = 0;
    for (const key of banKeys) {
      const bannedUntilRaw = await shieldStorage.getItem(key);
      if (isActualBanTimestampExpired(bannedUntilRaw)) {
        await shieldStorage.removeItem(key);
        cleanedCount++;
      }
    }
    console.log(`[nuxt-api-shield] Cleaned ${cleanedCount} expired ban(s).`);
    return { result: { cleanedCount } };
  },
});
```
The `isActualBanTimestampExpired` utility is provided by `nuxt-api-shield` and should be available via `#imports`.

#### b) Task for Cleaning Old IP Tracking Data

This task cleans up IP tracking entries (`ip:xxx.xxx.xxx.xxx`) that haven't been active (i.e., their `time` field hasn't been updated) for a certain period. This period is defined by the `ipTTL` configuration option in your `nuxt.config.ts` (under `nuxtApiShield`), which defaults to 7 days. This cleanup helps prevent your storage from growing indefinitely with IPs that make a few requests but are never banned.

In `server/tasks/shield/cleanIpData.ts`:

```ts
import type { RateLimit } from '#imports'; // Or from 'nuxt-api-shield/types' if made available by the module
import { useRuntimeConfig } from '#imports';

export default defineTask({
  meta: {
    name: 'shield:cleanIpData', // Match the name in scheduledTasks
    description: 'Clean old IP tracking data from nuxt-api-shield storage.',
  },
  async run() {
    const shieldStorage = useStorage('shield');
    const config = useRuntimeConfig().public.nuxtApiShield;

    // ipTTL is expected to be in seconds from config (module applies default if not set by user)
    const ipTTLseconds = config.ipTTL;

    if (!ipTTLseconds || ipTTLseconds <= 0) {
      console.log('[nuxt-api-shield] IP data cleanup (ipTTL) is disabled or invalid.');
      return { result: { cleanedCount: 0, status: 'disabled_or_invalid_ttl' } };
    }
    const ipTTLms = ipTTLseconds * 1000;

    const ipKeys = await shieldStorage.getKeys('ip:');
    const currentTime = Date.now();
    let cleanedCount = 0;

    for (const key of ipKeys) {
      const entry = await shieldStorage.getItem(key) as RateLimit | null;

      // Check if entry exists and has a numeric 'time' property
      if (entry && typeof entry.time === 'number') {
        if ((currentTime - entry.time) > ipTTLms) {
          await shieldStorage.removeItem(key);
          cleanedCount++;
        }
      } else {
        // Clean up entries that are null, not an object, or missing a numeric 'time'
        await shieldStorage.removeItem(key);
        cleanedCount++;
      }
    }

    console.log(`[nuxt-api-shield] Cleaned ${cleanedCount} old/malformed IP data entries.`);
    return { result: { cleanedCount } };
  },
});
```
Make sure to configure `ipTTL` in your `nuxt.config.ts` under `nuxtApiShield` if you wish to use a value different from the default (7 days). Setting `ipTTL: 0` (or any non-positive number) in your config will disable this cleanup task. The `RateLimit` type should be available via `#imports` if your module exports it or makes it available to Nuxt's auto-import system.

## Per-Route Rate Limiting

`nuxt-api-shield` supports **per-route rate limiting**, allowing you to define custom limits for specific API endpoints while keeping a global default configuration for all other routes.

This is useful when certain endpoints (such as `/api/login`, `/api/auth`, or `/api/payment`) require stricter protection.

---

### Configuration Example

The `routes` option accepts a mixed array:

- **String:** applies the **global rate limit configuration**
- **Object:** applies **custom per-route limits**

```ts
export default defineNuxtConfig({
  modules: ['nuxt-api-shield'],

  nuxtApiShield: {
    limit: {
      max: 12,
      duration: 108,
      ban: 3600
    },

    routes: [
      // 1. String: uses the global default limit
      '/api/example',

      // 2. Object: custom rate limit for a specific route
      {
        path: '/api/example-per-route',
        max: 5,       // custom max requests
        duration: 10  // custom duration (seconds)
        // ⚠️ "ban" always uses the global value
      }
    ],
  }
})
```


## Important Considerations

### Data Privacy (IP Address Storage)

`nuxt-api-shield` functions by tracking IP addresses to monitor request rates and apply bans. This means IP addresses, which can be considered Personally Identifiable Information (PII) under regulations like GDPR, are stored by the module.

- **Data Stored:**
    - `ip:<IP_ADDRESS>`: Stores `{ count: number, time: number }` for tracking request rates.
    - `ban:<IP_ADDRESS>`: Stores a timestamp indicating when a ban on an IP address expires.
- **Compliance:** Ensure your usage complies with any applicable data privacy regulations. This may involve updating your privacy policy to inform users about this data processing.
- **Data Retention:**
    - Ban entries are cleaned up by the `shield:cleanBans` task after expiry.
    - IP tracking entries are cleaned up by the `shield:cleanIpData` task based on the `ipTTL` setting.

### Storage Security

- **Filesystem Driver (`driver: 'fs'`):** If you use the filesystem driver for `unstorage` (e.g., `driver: 'fs'`, `base: '.shield'`), ensure that the storage directory (and the `logs` directory if logging is enabled via `log.path`) is:
    - **Not web-accessible:** Your web server should not be configured to serve files from these directories.
    - **Properly permissioned:** The directories should have appropriate server-side file permissions to prevent unauthorized reading or writing.
- **Other Drivers (Redis, etc.):** If using database drivers like Redis, ensure your database server itself is secured (e.g., authentication, network access controls).

### Error Message (`errorMessage`)

The `errorMessage` option in the module configuration is returned in the body of a 429 response.
- It's recommended to use a plain text message.
- If you choose to use HTML in your `errorMessage`, ensure your client-side application correctly sanitizes it or renders it in a way that prevents XSS vulnerabilities. The module itself does not sanitize this user-configured message.

## Development

```bash
# Install dependencies
yarn

# Generate type stubs
yarn dev:prepare

# Develop with the playground
yarn dev

# Build the playground
yarn dev:build

# Run ESLint
yarn lint

# Run Vitest
yarn test
yarn test:watch

# Release new version
yarn release:patch
yarn release:minor
```

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/nuxt-api-shield/latest.svg?style=flat&colorA=020420&colorB=00DC82
[npm-version-href]: https://npmjs.com/package/nuxt-api-shield
[npm-downloads-src]: https://img.shields.io/npm/dm/nuxt-api-shield.svg?style=flat&colorA=020420&colorB=00DC82
[npm-downloads-href]: https://npmjs.com/package/nuxt-api-shield
[license-src]: https://img.shields.io/npm/l/nuxt-api-shield.svg?style=flat&colorA=020420&colorB=00DC82
[license-href]: https://npmjs.com/package/nuxt-api-shield
[nuxt-src]: https://img.shields.io/badge/Nuxt-020420?logo=nuxt.js
[nuxt-href]: https://nuxt.com
