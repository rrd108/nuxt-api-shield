# Changelog

## v0.10.2

[compare changes](https://github.com/rrd108/nuxt-api-shield/compare/v0.10.1...v0.10.2)

### 💅 Refactors

- Improve type safety for Nitro configuration and tests ([c9b8436](https://github.com/rrd108/nuxt-api-shield/commit/c9b8436))

### 📖 Documentation

- Update documentation for bundled cleanup tasks ([00efea0](https://github.com/rrd108/nuxt-api-shield/commit/00efea0))
- Fix v0.10.1 changelog compare link after removing stray v0.11.0 tag ([ccbaaf2](https://github.com/rrd108/nuxt-api-shield/commit/ccbaaf2))

### 🏡 Chore

- **release:** V0.10.1 ([1d654ad](https://github.com/rrd108/nuxt-api-shield/commit/1d654ad))
- Upgrade typescript to v6.0 and @types/node ([8b4de7b](https://github.com/rrd108/nuxt-api-shield/commit/8b4de7b))

### ✅ Tests

- Add wildcard and dynamic route fixtures ([84f32e8](https://github.com/rrd108/nuxt-api-shield/commit/84f32e8))

### ❤️ Contributors

- Rrd108 ([@rrd108](https://github.com/rrd108))

## v0.10.2

### 🩹 Fixes

- Server middleware: explicit `h3` / `nitropack/runtime` imports so `defineEventHandler` and related APIs resolve when the module is built from `node_modules` ([#156](https://github.com/rrd108/nuxt-api-shield/issues/156))
- Remove stray debug `console.log` from shield middleware

## v0.10.1

[compare changes](https://github.com/rrd108/nuxt-api-shield/compare/v0.10.0...v0.10.1)

## v0.10.0

[compare changes](https://github.com/rrd108/nuxt-api-shield/compare/v0.9.2...v0.10.0)

### 🩹 Fixes

- Correctly configures build process ([87d775a](https://github.com/rrd108/nuxt-api-shield/commit/87d775a))

### ❤️ Contributors

- Rrd108 ([@rrd108](https://github.com/rrd108))

## v0.9.2

[compare changes](https://github.com/rrd108/nuxt-api-shield/compare/v0.9.1...v0.9.2)

### 🩹 Fixes

- Resolves type export issue and improves build ([8b524a3](https://github.com/rrd108/nuxt-api-shield/commit/8b524a3))
- Linter errors ([b8b0cd5](https://github.com/rrd108/nuxt-api-shield/commit/b8b0cd5))

### ❤️ Contributors

- Rrd108 ([@rrd108](https://github.com/rrd108))

## v0.9.1

[compare changes](https://github.com/rrd108/nuxt-api-shield/compare/v0.9.0...v0.9.1)

### 🩹 Fixes

- **deps:** Update nuxtjs monorepo to v4 ([50a0b73](https://github.com/rrd108/nuxt-api-shield/commit/50a0b73))
- Exposes RateLimit type and improves documentation ([13915b9](https://github.com/rrd108/nuxt-api-shield/commit/13915b9))
- Updates imports and adds export ([bb4ce30](https://github.com/rrd108/nuxt-api-shield/commit/bb4ce30))

### ❤️ Contributors

- Rrd108 ([@rrd108](https://github.com/rrd108))

## v0.8.5

[compare changes](https://github.com/rrd108/nuxt-api-shield/compare/v0.8.4...v0.8.5)

### 🏡 Chore

- **release:** V0.8.4 ([b89f514](https://github.com/rrd108/nuxt-api-shield/commit/b89f514))

### ❤️ Contributors

- Rrd108 ([@rrd108](https://github.com/rrd108))

## v0.8.4

[compare changes](https://github.com/rrd108/nuxt-api-shield/compare/v0.8.3...v0.8.4)

## v0.8.3

[compare changes](https://github.com/rrd108/nuxt-api-shield/compare/v0.8.2...v0.8.3)

### 🚀 Enhancements

- Implement fixes and improvements from security audit (v2) ([6238f4e](https://github.com/rrd108/nuxt-api-shield/commit/6238f4e))

### 🩹 Fixes

- **deps:** Update nuxtjs monorepo to v3.18.0 ([250a3d0](https://github.com/rrd108/nuxt-api-shield/commit/250a3d0))
- Remove AI crap ([f901e1d](https://github.com/rrd108/nuxt-api-shield/commit/f901e1d))
- Failing test ([01f3ecf](https://github.com/rrd108/nuxt-api-shield/commit/01f3ecf))
- **deps:** Update nuxtjs monorepo to v3.18.1 ([17cd36d](https://github.com/rrd108/nuxt-api-shield/commit/17cd36d))

### 🏡 Chore

- Fix linting errors ([6f8b0d3](https://github.com/rrd108/nuxt-api-shield/commit/6f8b0d3))
- Fix formatting ([647d565](https://github.com/rrd108/nuxt-api-shield/commit/647d565))
- Add lint back ([f7e53d6](https://github.com/rrd108/nuxt-api-shield/commit/f7e53d6))

### ❤️ Contributors

- Rrd108 ([@rrd108](https://github.com/rrd108))

## v0.8.2

[compare changes](https://github.com/rrd108/nuxt-api-shield/compare/v0.8.1...v0.8.2)

### 🏡 Chore

- **release:** V0.8.1 ([38f61f5](https://github.com/rrd108/nuxt-api-shield/commit/38f61f5))

### ❤️ Contributors

- Rrd108 ([@rrd108](http://github.com/rrd108))

## v0.8.1

[compare changes](https://github.com/rrd108/nuxt-api-shield/compare/v0.8.0...v0.8.1)

### 🩹 Fixes

- **deps:** Update nuxtjs monorepo to v3.14.159 ([bafc40b](https://github.com/rrd108/nuxt-api-shield/commit/bafc40b))
- **deps:** Update nuxtjs monorepo to v3.14.1592 ([576f866](https://github.com/rrd108/nuxt-api-shield/commit/576f866))
- Improve rate limiting logic closes #77 ([#77](https://github.com/rrd108/nuxt-api-shield/issues/77))

### 📖 Documentation

- Update README to clarify ban behavior and response handling for rate limits ([b435cba](https://github.com/rrd108/nuxt-api-shield/commit/b435cba))

### 🏡 Chore

- Add nuxi dependency and update tsconfig options ([a95dca3](https://github.com/rrd108/nuxt-api-shield/commit/a95dca3))

### ✅ Tests

- Adjust wait time for ban expiration in rate limit tests ([f87cd12](https://github.com/rrd108/nuxt-api-shield/commit/f87cd12))

### ❤️ Contributors

- Rrd ([@rrd108](https://github.com/rrd108))

## v0.7.1

[compare changes](https://github.com/rrd108/nuxt-api-shield/compare/v0.7.0...v0.7.1)

### 🩹 Fixes

- **deps:** Update nuxtjs monorepo to v3.13.2 ([95197ee](https://github.com/rrd108/nuxt-api-shield/commit/95197ee))

## v0.6.10

[compare changes](https://github.com/rrd108/nuxt-api-shield/compare/v0.6.8...v0.6.10)

### 🏡 Chore

- **release:** V0.6.8 ([52326ce](https://github.com/rrd108/nuxt-api-shield/commit/52326ce))
- **release:** V0.6.9 ([17f53f3](https://github.com/rrd108/nuxt-api-shield/commit/17f53f3))

### ❤️ Contributors

- Rrd108 ([@rrd108](http://github.com/rrd108))

## v0.6.9

[compare changes](https://github.com/rrd108/nuxt-api-shield/compare/v0.6.8...v0.6.9)

### 🏡 Chore

- **release:** V0.6.8 ([52326ce](https://github.com/rrd108/nuxt-api-shield/commit/52326ce))

### ❤️ Contributors

- Rrd108 ([@rrd108](http://github.com/rrd108))

## v0.6.8

[compare changes](https://github.com/rrd108/nuxt-api-shield/compare/v0.6.7...v0.6.8)

## v0.6.7

[compare changes](https://github.com/rrd108/nuxt-api-shield/compare/v0.6.6...v0.6.7)

## v0.6.6

[compare changes](https://github.com/rrd108/nuxt-api-shield/compare/v0.6.0...v0.6.6)

### 🚀 Enhancements

- Expose RateLimit type ([536c73e](https://github.com/rrd108/nuxt-api-shield/commit/536c73e))

### 🏡 Chore

- Remove unused import ([17f40fe](https://github.com/rrd108/nuxt-api-shield/commit/17f40fe))
- **release:** V0.6.1 ([3641e5b](https://github.com/rrd108/nuxt-api-shield/commit/3641e5b))
- **release:** V0.6.3 ([0f05e4c](https://github.com/rrd108/nuxt-api-shield/commit/0f05e4c))
- **release:** V0.6.5 ([505e1fd](https://github.com/rrd108/nuxt-api-shield/commit/505e1fd))

### ❤️ Contributors

- Rrd108 <rrd@webmania.cc>

## v0.6.5

[compare changes](https://github.com/rrd108/nuxt-api-shield/compare/v0.6.4...v0.6.5)

## v0.6.3

[compare changes](https://github.com/rrd108/nuxt-api-shield/compare/v0.6.2...v0.6.3)

## v0.6.1

[compare changes](https://github.com/rrd108/nuxt-api-shield/compare/v0.6.0...v0.6.1)

### 🚀 Enhancements

- Expose RateLimit type ([536c73e](https://github.com/rrd108/nuxt-api-shield/commit/536c73e))

### 🏡 Chore

- Remove unused import ([17f40fe](https://github.com/rrd108/nuxt-api-shield/commit/17f40fe))

### ❤️ Contributors

- Rrd108 <rrd@webmania.cc>

## v0.5.1

[compare changes](https://github.com/rrd108/nuxt-api-shield/compare/v0.4.2...v0.5.1)

### 🏡 Chore

- Comments removed ([39f3025](https://github.com/rrd108/nuxt-api-shield/commit/39f3025))

### ❤️ Contributors

- Rrd108 <rrd@webmania.cc>

## v0.4.2

[compare changes](https://github.com/rrd108/nuxt-api-shield/compare/v0.4.1...v0.4.2)

### 🏡 Chore

- **release:** V0.4.1 ([656f5d6](https://github.com/rrd108/nuxt-api-shield/commit/656f5d6))

### ❤️ Contributors

- Rrd108 <rrd@webmania.cc>

## v0.4.1

[compare changes](https://github.com/rrd108/nuxt-api-shield/compare/v0.4.0...v0.4.1)

## v0.3.1

[compare changes](https://github.com/rrd108/nuxt-api-shield/compare/v0.3.0...v0.3.1)

### 🚀 Enhancements

- Add optional retry-after header fix #4 ([#4](https://github.com/rrd108/nuxt-api-shield/issues/4))

### 🏡 Chore

- Comment added ([b5ed91a](https://github.com/rrd108/nuxt-api-shield/commit/b5ed91a))

### ✅ Tests

- Change test to pass for custom error message ([a13b631](https://github.com/rrd108/nuxt-api-shield/commit/a13b631))
- Fix error throwing problems ([9538b42](https://github.com/rrd108/nuxt-api-shield/commit/9538b42))

### ❤️ Contributors

- Rrd108 <rrd@webmania.cc>

## v0.3.0

[compare changes](https://github.com/rrd108/nuxt-api-shield/compare/v0.2.0...v0.2.1)

### 🚀 Enhancements

- Implements auto cleanup fix #3 ([#3](https://github.com/rrd108/nuxt-api-shield/issues/3))

### 🏡 Chore

- Fix package description and link ([7d5ebff](https://github.com/rrd108/nuxt-api-shield/commit/7d5ebff))

### ❤️ Contributors

- Rrd108 <rrd@webmania.cc>

## v0.2.0

[compare changes](https://github.com/your-org/nuxt-api-shield/compare/v0.1.0...v0.1.1)

### 🚀 Enhancements

- Delay on ban implemented fix #1 ([#1](https://github.com/your-org/nuxt-api-shield/issues/1))

### 🏡 Chore

- New keywords added ([3327645](https://github.com/your-org/nuxt-api-shield/commit/3327645))
- Ignore .shield ([d17878b](https://github.com/your-org/nuxt-api-shield/commit/d17878b))
- Add comments ([9fc0ce9](https://github.com/your-org/nuxt-api-shield/commit/9fc0ce9))

### ✅ Tests

- Increase timeout to test ban time ([b7bfefd](https://github.com/your-org/nuxt-api-shield/commit/b7bfefd))

### ❤️ Contributors

- Rrd108 <rrd@webmania.cc>

## v0.0.2

### 🚀 Enhancements

- Rate limiting implemented ([04b9ea7](https://github.com/your-org/nuxt-api-shield/commit/04b9ea7))
- Nitro settings added to example ([34febf7](https://github.com/your-org/nuxt-api-shield/commit/34febf7))

### 🩹 Fixes

- README contains all info ([3d0d979](https://github.com/your-org/nuxt-api-shield/commit/3d0d979))

### 🏡 Chore

- Keywords added ([a0ada9b](https://github.com/your-org/nuxt-api-shield/commit/a0ada9b))
- Use yarn for release ([dccd1aa](https://github.com/your-org/nuxt-api-shield/commit/dccd1aa))
- Endpoint renamed ([2ad82b0](https://github.com/your-org/nuxt-api-shield/commit/2ad82b0))
- Config order changed ([1343731](https://github.com/your-org/nuxt-api-shield/commit/1343731))
- Unused paramterer removed ([2e99f94](https://github.com/your-org/nuxt-api-shield/commit/2e99f94))

### ❤️ Contributors

- Rrd108 <rrd@webmania.cc>
