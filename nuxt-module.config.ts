export default defineNuxtModuleConfig({
  build: {
    failOnWarn: false,
    // Ignore warnings about generated type files
    rollup: {
      onwarn(warning, warn) {
        // Ignore warnings about missing package.json for generated type files
        if (warning.message?.includes('Potential missing package.json')) {
          return
        }
        warn(warning)
      },
    },
  },
})
