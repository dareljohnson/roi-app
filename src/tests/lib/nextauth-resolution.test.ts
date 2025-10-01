/**
 * Next.js + NextAuth Module Resolution Tests
 * 
 * This test suite verifies that next-auth modules can be properly imported
 * and resolved to prevent build-time module resolution errors.
 */

import { describe, it, expect, jest } from '@jest/globals'

// Mock the problematic ESM modules
jest.mock('jose', () => ({
  jwtVerify: jest.fn(),
  SignJWT: jest.fn(),
}))

jest.mock('openid-client', () => ({
  Issuer: {
    discover: jest.fn(),
  },
  Client: jest.fn(),
}))

describe('NextAuth Module Resolution', () => {
  it('should be able to resolve NextAuth core module path', () => {
    expect(() => {
      require.resolve('next-auth')
    }).not.toThrow()
  })

  it('should be able to resolve NextAuth React module path', () => {
    expect(() => {
      require.resolve('next-auth/react')
    }).not.toThrow()
  })

  it('should be able to resolve NextAuth providers module path', () => {
    expect(() => {
      require.resolve('next-auth/providers/credentials')
    }).not.toThrow()
  })

  it('should be able to resolve NextAuth server functions module path', () => {
    expect(() => {
      require.resolve('next-auth/next')
    }).not.toThrow()
  })

  it('should be able to resolve Prisma adapter module path', () => {
    expect(() => {
      require.resolve('@next-auth/prisma-adapter')
    }).not.toThrow()
  })

  it('should have all required NextAuth dependencies installed', () => {
    const packageJson = require('../../../package.json')
    
    expect(packageJson.dependencies).toHaveProperty('next-auth')
    expect(packageJson.dependencies).toHaveProperty('@next-auth/prisma-adapter')
    
    // Verify version compatibility
    const nextAuthVersion = packageJson.dependencies['next-auth']
    expect(nextAuthVersion).toMatch(/\^?4\./) // Should be v4.x (with or without caret)
  })

  it('should be able to import auth configuration without errors', () => {
    expect(() => {
      const authConfig = require('../../lib/auth')
      expect(authConfig).toBeDefined()
      expect(authConfig.authOptions).toBeDefined()
    }).not.toThrow()
  })
})