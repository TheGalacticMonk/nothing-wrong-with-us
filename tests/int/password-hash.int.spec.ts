import crypto from 'node:crypto'
import { describe, expect, it } from 'vitest'

// Deep imports of the patched module (patches/payload@3.90.1.patch).
import { authenticateLocalStrategy } from '../../node_modules/payload/dist/auth/strategies/local/authenticate.js'
import { generatePasswordSaltHash } from '../../node_modules/payload/dist/auth/strategies/local/generatePasswordSaltHash.js'

/**
 * Cloudflare Workers refuses PBKDF2 above 100,000 iterations in production, so the Payload patch
 * hashes new passwords with 100k. Old 600k ("v1") hashes must still verify and be flagged for upgrade.
 */
describe('password hashing (Workers-compatible patch)', () => {
  const password = 'correct horse battery staple 42'

  it('hashes new passwords with 100,000 iterations under the 100k prefix', async () => {
    const { hash, salt } = await generatePasswordSaltHash({ isPasswordAuthenticated: true, password } as never)
    expect(hash.startsWith('pbkdf2-sha256-100k-v1:')).toBe(true)
    const raw = crypto.pbkdf2Sync(password, salt, 100_000, 32, 'sha256').toString('hex')
    expect(hash).toBe(`pbkdf2-sha256-100k-v1:${raw}`)

    const ok = await authenticateLocalStrategy({ doc: { hash, salt } as never, password })
    expect(ok).toMatchObject({ shouldUpdatePasswordHash: false })
    expect(await authenticateLocalStrategy({ doc: { hash, salt } as never, password: 'wrong' })).toBeNull()
  })

  it('still verifies unpatched 600k v1 hashes and flags them for upgrade', async () => {
    const salt = crypto.randomBytes(32).toString('hex')
    const hash = `pbkdf2-sha256-v1:${crypto.pbkdf2Sync(password, salt, 600_000, 32, 'sha256').toString('hex')}`
    const ok = await authenticateLocalStrategy({ doc: { hash, salt } as never, password })
    expect(ok).toMatchObject({ shouldUpdatePasswordHash: true })
  })
})
