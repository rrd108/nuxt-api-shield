# Config source precedence: inline beats the Shield config file, arrays are replaced

From v2, shield options are resolved from Config sources in this order, highest first: `runtimeConfig.nuxtApiShield`, inline `nuxtApiShield` in nuxt.config, the Shield config file (`.config/nuxt-api-shield.<ext>`), then the defaults. Objects (`limit`, `security`, `log`) deep-merge; arrays (`routes`, `skipRoutes`) are taken whole from the highest source that sets them. Inline stays above the file so that what is written in nuxt.config keeps winning, as it did before the file existed, and setting both raises a warning instead of a silent override. Arrays are replaced because concatenating Route rules across sources (defu's default) produced duplicate, order-dependent matches.

## Considered Options

- **File above inline**: rejected; it would silently change the meaning of existing nuxt.config setups when a file is added.
- **defu concatenation for arrays**: rejected; Route rules from two sources would both apply, with the winner decided by array order.
