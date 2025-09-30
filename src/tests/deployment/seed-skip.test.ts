/**
 * Tests that the seed script exits successfully and skips user/property creation
 * when required environment credentials are absent.
 */
import { spawnSync } from 'child_process'
import path from 'path'

// Run the actual seed script in a separate Node process with blank env vars
function runSeed(env: Record<string,string | undefined>) {
  const script = path.resolve(__dirname, '../../../prisma/seed.js')
  const result = spawnSync(process.execPath, [script], {
    env: { ...process.env, ...env },
    encoding: 'utf-8'
  })
  return result
}

describe('Seed Script Credential Guards', () => {
  it('skips admin + property creation when credentials are missing and exits 0', () => {
    const result = runSeed({
      SEED_ADMIN_EMAIL: '',
      SEED_ADMIN_PASSWORD: '',
      SEED_ADMIN2_EMAIL: '',
      SEED_ADMIN2_PASSWORD: ''
    })

    expect(result.status).toBe(0)
    expect(result.stdout).toContain('Skipping primary admin creation')
    expect(result.stdout).toContain('No secondary admin credentials provided; skipping.')
    expect(result.stdout).toContain('Skipping sample property creation')
  })
})
