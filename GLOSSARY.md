# nuxt-api-shield

Rate limiting and IP banning for a Nuxt app's `/api/` routes.

## Configuration

**Config source**:
One place a user can set shield options: runtime config, the inline `nuxtApiShield` key in nuxt.config, or the Shield config file. Sources rank in that order, highest first, above the defaults.
_Avoid_: config layer, config input

**Shield config file**:
The dedicated config file for the shield, `.config/nuxt-api-shield.<ext>` (or `nuxt-api-shield.config.<ext>` at the project root).
_Avoid_: rc file, shield.config

**Resolved config**:
The single, complete set of shield options produced from all Config sources plus the defaults, with nothing left optional. It is the only config the request-time code sees.
_Avoid_: merged config, final options, runtime options

## Limiting

**Route rule**:
A configured path (exact, segment prefix, or wildcard pattern) together with the limit that applies to requests matching it.
_Avoid_: route config, route limit

**Skip route**:
A path exempt from the shield entirely, checked before any Route rule.
_Avoid_: whitelist, excluded route

**Ban**:
A period during which every shielded request from one IP is rejected with 429, started when that IP exceeds a Route rule's limit.
_Avoid_: block, lockout
