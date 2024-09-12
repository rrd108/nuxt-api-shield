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
  - Add a delay to responses when a user is banned to discourage further abuse.
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
  - Returns a standardized 429 "Too Many Requests" error response when rate limits are exceeded.
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
  },
});
```

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

### 4. Add `shield:clean` to `nuxt.config.ts`

```json
{
  "nitro": {
    "experimental": {
      "tasks": true
    },
    "scheduledTasks": {
      "*/15 * * * *": ["shield:clean"] // clean the shield storage every 15 minutes
    }
  }
}
```

### 5. Create your `clean` task

In `server/tasks/shield/clean.ts` you should have something like this.

```ts
import type { RateLimit } from "#imports";

export default defineTask({
  meta: {
    description: "Clean expired bans",
  },
  async run() {
    const shieldStorage = useStorage("shield");

    const keys = await shieldStorage.getKeys();
    keys.forEach(async (key) => {
      const rateLimit = (await shieldStorage.getItem(key)) as RateLimit;
      if (isBanExpired(rateLimit)) {
        await shieldStorage.removeItem(key);
      }
    });
    return { result: keys };
  },
});
```

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
