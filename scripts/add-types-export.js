import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '..')
const typesFile = join(rootDir, 'dist', 'types.d.mts')

const content = readFileSync(typesFile, 'utf-8')

// Check if RateLimit is already exported
if (content.includes('export type { RateLimit }')) {
  console.log('RateLimit export already exists in types.d.mts')
  process.exit(0)
}

// Append the export if it doesn't exist
const newContent = content + '\n\nexport type { RateLimit } from \'./runtime/server/types/RateLimit\'\n'
writeFileSync(typesFile, newContent, 'utf-8')
console.log('Added RateLimit export to types.d.mts')
