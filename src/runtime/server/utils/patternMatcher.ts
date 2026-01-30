/**
 * Secure glob pattern matching utility for API route protection
 *
 * Supports:
 * - '*'  : Single path segment wildcard (matches one directory level)
 * - '**' : Multi-path segment wildcard (matches zero or more directory levels)
 *
 * Security features:
 * - Validates patterns to prevent bypass attacks
 * - Enforces complexity limits
 * - Prevents matching system/critical paths
 */

/**
 * Check if a path matches a glob pattern
 * @param pattern - The glob pattern to match against
 * @param path - The actual path to test
 * @returns boolean indicating if path matches pattern
 */
export function matchesPattern(pattern: string, path: string): boolean {
  // Handle exact matches first (no wildcards)
  if (!pattern.includes('*')) {
    return pattern === path
  }

  // Convert glob pattern to regex
  const regexPattern = convertGlobToRegex(pattern)
  const regex = new RegExp(`^${regexPattern}$`)

  return regex.test(path)
}

/**
 * Validate that a pattern is safe to use
 * @param pattern - The pattern to validate
 * @returns boolean indicating if pattern is safe
 */
export function validatePattern(pattern: string): boolean {
  // Basic safety checks
  if (!pattern.startsWith('/')) {
    return false // Must be absolute path
  }

  // Count wildcards to prevent excessive complexity
  const starCount = (pattern.match(/\*/g) || []).length
  const doubleStarCount = (pattern.match(/\*\*/g) || []).length

  // Limit total wildcards
  if (starCount > 4) {
    return false
  }

  // Limit double wildcards
  if (doubleStarCount > 2) {
    return false
  }

  // Prevent dangerous patterns that could match system paths
  const dangerousPatterns = [
    '/**', // Matches everything
    '/*', // Too broad for root
    '/**/*', // Redundant and dangerous
    '/api*', // Could match unintended prefixes
    '*/', // Trailing wildcard slash
  ]

  for (const dangerous of dangerousPatterns) {
    if (pattern === dangerous || pattern.startsWith(dangerous)) {
      return false
    }
  }

  // Check for invalid consecutive wildcards
  if (pattern.includes('****') || pattern.includes('***')) {
    return false
  }

  // Check for invalid wildcard combinations
  if (pattern.includes('**/*/**') || pattern.includes('*/**/*')) {
    return false
  }

  // Prevent patterns that could bypass security by matching critical substrings
  if (pattern.includes('**/') && pattern.split('/').length < 3) {
    return false // Too broad multi-segment match
  }

  // Ensure pattern has reasonable structure
  const segments = pattern.split('/')
  if (segments.length < 3) {
    return false // Require at least /api/ structure
  }

  return true
}

/**
 * Convert glob pattern to regex pattern
 * @param glob - The glob pattern
 * @returns regex pattern string
 */
function convertGlobToRegex(glob: string): string {
  // Escape special regex characters except * and /
  let regex = glob.replace(/[[\](){}.+?^$|\\]/g, '\\$&')

  // Convert ** (multi-segment wildcard) - must be handled before single *
  // Match zero or more path segments
  regex = regex.replace(/\/\*\*\//g, '(?:/.*)*/')
  regex = regex.replace(/^\*\*\//, '(?:.*)*/')
  regex = regex.replace(/\/\*\*$/, '(?:/.*)*')
  regex = regex.replace(/^\*\*$/, '.*')

  // Convert * (single-segment wildcard)
  regex = regex.replace(/\/\*\//g, '/[^/]*/')
  regex = regex.replace(/^\*\//, '[^/]*/')
  regex = regex.replace(/\/\*$/, '/[^/]*')
  regex = regex.replace(/^\*$/, '[^/]*')

  return regex
}

/**
 * Get specificity score for pattern matching precedence
 * Higher scores mean more specific matches should take precedence
 * @param pattern - The pattern to score
 * @returns numeric specificity score
 */
export function getPatternSpecificity(pattern: string): number {
  if (!pattern.includes('*')) {
    return 100 // Exact matches have highest precedence
  }

  const starCount = (pattern.match(/\*/g) || []).length
  const doubleStarCount = (pattern.match(/\*\*/g) || []).length

  // More specific patterns (fewer wildcards) get higher scores
  // Double wildcards are less specific than single wildcards
  return 50 - (starCount * 5) - (doubleStarCount * 10)
}
