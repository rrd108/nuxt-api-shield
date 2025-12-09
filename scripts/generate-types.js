// Auto-generate index.d.ts with type exports
// This script runs automatically after the module build

import { writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '..')
const indexPath = join(rootDir, 'dist', 'index.d.mts')

const content = `// Auto-generated type exports for nuxt-api-shield
// This file is generated automatically during build - DO NOT EDIT MANUALLY

export type { RateLimit } from './runtime/server/types/RateLimit.js'
export type { LogEntry } from './runtime/server/types/LogEntry.js'
export type { ModuleOptions, RouteLimitConfiguration } from './types.js'
`

writeFileSync(indexPath, content, 'utf-8')
console.log('✓ Generated dist/index.d.mts')
