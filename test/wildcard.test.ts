import { describe, it, expect } from 'vitest'
import { matchesPattern, validatePattern } from '../src/runtime/server/utils/patternMatcher'

describe('wildcard pattern matching', () => {
  describe('basic wildcard matching', () => {
    it('should match exact paths without wildcards', () => {
      expect(matchesPattern('/api/users', '/api/users')).toBe(true)
      expect(matchesPattern('/api/users/123', '/api/users/123')).toBe(true)
    })

    it('should not match different exact paths', () => {
      expect(matchesPattern('/api/users', '/api/posts')).toBe(false)
      expect(matchesPattern('/api/users/123', '/api/users/456')).toBe(false)
    })

    it('should match single-level wildcards (*)', () => {
      expect(matchesPattern('/api/*/profile', '/api/users/profile')).toBe(true)
      expect(matchesPattern('/api/*/profile', '/api/admin/profile')).toBe(true)
      expect(matchesPattern('/api/users/*', '/api/users/123')).toBe(true)
      expect(matchesPattern('/api/users/*', '/api/users/settings')).toBe(true)
    })

    it('should not match single-level wildcards incorrectly', () => {
      expect(matchesPattern('/api/*/profile', '/api/users/admin/profile')).toBe(false)
      expect(matchesPattern('/api/users/*', '/api/users/123/details')).toBe(false)
      expect(matchesPattern('/api/*/profile', '/api/profile')).toBe(false)
    })

    it('should match multi-level wildcards (**)', () => {
      expect(matchesPattern('/api/**/details', '/api/users/123/details')).toBe(true)
      expect(matchesPattern('/api/**/details', '/api/admin/reports/details')).toBe(true)
      expect(matchesPattern('/api/**/details', '/api/details')).toBe(true)
      expect(matchesPattern('/**/profile', '/api/users/profile')).toBe(true)
      expect(matchesPattern('/**/profile', '/users/profile')).toBe(true)
    })

    it('should handle mixed wildcards', () => {
      expect(matchesPattern('/api/*/reports/**/summary', '/api/users/reports/monthly/2023/summary')).toBe(true)
      expect(matchesPattern('/api/*/reports/**/summary', '/api/admin/reports/annual/summary')).toBe(true)
    })
  })

  describe('pattern validation', () => {
    it('should validate safe patterns', () => {
      expect(validatePattern('/api/users/*')).toBe(true)
      expect(validatePattern('/api/*/profile')).toBe(true)
      expect(validatePattern('/api/**/details')).toBe(true)
    })

    it('should reject dangerous patterns', () => {
      // Patterns that could match system paths
      expect(validatePattern('/**')).toBe(false)
      expect(validatePattern('/*')).toBe(false)
      expect(validatePattern('/**/*')).toBe(false)
      
      // Patterns with invalid syntax
      expect(validatePattern('/api/**/*/**')).toBe(false) // Too many wildcards
      expect(validatePattern('/api/****/test')).toBe(false) // Invalid wildcard usage
    })

    it('should reject patterns that could bypass security', () => {
      // Patterns that might match unintended routes
      expect(validatePattern('/api*/users')).toBe(false) // Could match /apisecret/users
      expect(validatePattern('/api*')).toBe(false) // Too broad
    })
  })

  describe('precedence rules', () => {
    it('should prioritize exact matches over wildcard matches', () => {
      // This would be tested at the route matching level
      // Exact match should take precedence over wildcard match
    })
  })
})