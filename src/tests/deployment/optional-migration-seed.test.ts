// Tests for optional migration and seed controls in deploy-db.sh
// Ensures that environment variables DEPLOY_RUN_MIGRATIONS and DEPLOY_RUN_SEED
// are documented and implemented correctly.

import * as fs from 'fs'

describe('Optional Migration & Seeding Controls', () => {
  const scriptPath = 'scripts/deploy-db.sh'
  let content: string

  beforeAll(() => {
    expect(fs.existsSync(scriptPath)).toBe(true)
    content = fs.readFileSync(scriptPath, 'utf8')
  })

  it('should define helper function should_run', () => {
    expect(content).toContain('should_run()')
  })

  it('should reference DEPLOY_RUN_MIGRATIONS and DEPLOY_RUN_SEED', () => {
    expect(content).toMatch(/DEPLOY_RUN_MIGRATIONS/)
    expect(content).toMatch(/DEPLOY_RUN_SEED/)
  })

  it('should skip logic message when disabled', () => {
    expect(content).toContain('Skipping migrations')
    expect(content).toContain('Skipping seed')
  })

  it('should still warn if skipping migrations without existing DB', () => {
    expect(content).toContain('no existing /data/production.db')
  })

  it('should run migrate deploy when enabled', () => {
    expect(content).toContain('prisma migrate deploy')
  })

  it('should run prisma db seed when enabled', () => {
    expect(content).toContain('prisma db seed')
  })
})
