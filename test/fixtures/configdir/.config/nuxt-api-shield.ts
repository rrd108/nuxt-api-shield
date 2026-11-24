import { defineShieldConfig } from '../../../../src/config'

export default defineShieldConfig({
  limit: {
    max: 1,
    duration: 10,
    ban: 10,
  },
  delayOnBan: false,
  errorMessage: 'Limited by .config/nuxt-api-shield.ts',
})
