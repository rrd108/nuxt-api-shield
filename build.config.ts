import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  failOnWarn: false,
  // Rollup DTS must not follow transitive .d.ts from nuxt/vite/pkg-types (namespace exports / optional peers break resolution)
  externals: [
    'typescript',
    'pkg-types',
    'postcss',
    'lightningcss',
    'vite',
    'rollup',
    '@types/estree',
  ],
})
