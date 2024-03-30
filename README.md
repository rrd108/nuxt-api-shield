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

- **IP-Based Rate limiting**
  - Tracks and enforces rate limits for individual IP addresses.
  - Prevents malicious actors or excessive requests from a single source from overwhelming your API.
- **Customizable Rate Limits**
  - Configure maximum request count, duration within which the limit applies, and a ban period for exceeding the limit.
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

```js
export default defineNuxtConfig({
  modules: ["nuxt-api-shield"],
  nuxtApiShield: {
    /*limit: {
      max: 12,        // maximum requests per duration time, default is 12
      duration: 10,   // duration time in seconds, default is 10
      ban: 3600,      // ban time in seconds, default is 3600
    },*/
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
yarn release
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
