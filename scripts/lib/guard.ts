/**
 * Refuses to touch a remote (production) database by accident, and says which database a
 * script is about to use. Must run BEFORE `@payload-config` is imported, because importing the
 * config is what connects to D1/R2 (remotely when NODE_ENV=production).
 */
import fs from 'node:fs'
import path from 'node:path'

import { repoRoot } from './legacy'

export const args = new Set(process.argv.slice(2))
export const hasFlag = (flag: string) => args.has(flag)

const readWranglerConfig = () => {
  try {
    const raw = fs.readFileSync(path.join(repoRoot, 'wrangler.jsonc'), 'utf8')
    // Strip // and /* */ comments (not inside strings) and trailing commas, then parse.
    const json = raw
      .replace(/("(?:[^"\\]|\\.)*")|\/\/[^\n]*|\/\*[\s\S]*?\*\//g, (m, str) => str ?? '')
      .replace(/,(\s*[}\]])/g, '$1')
    return JSON.parse(json) as {
      d1_databases?: { binding: string; database_name: string }[]
      r2_buckets?: { binding: string; bucket_name: string }[]
    }
  } catch {
    return {}
  }
}

export const describeTarget = () => {
  const wrangler = readWranglerConfig()
  const d1 = wrangler.d1_databases?.find((d) => d.binding === 'D1')?.database_name ?? '(unknown)'
  const r2 = wrangler.r2_buckets?.find((b) => b.binding === 'R2')?.bucket_name ?? '(unknown)'
  const remote = process.env.NODE_ENV === 'production'
  const env = process.env.CLOUDFLARE_ENV ? ` (wrangler env "${process.env.CLOUDFLARE_ENV}")` : ''
  return remote
    ? `REMOTE Cloudflare D1 "${d1}" + R2 "${r2}"${env}`
    : `LOCAL wrangler emulation of D1 "${d1}" + R2 "${r2}"${env} in ${path.join(repoRoot, '.wrangler', 'state', 'v3')}`
}

/**
 * NODE_ENV=production makes payload.config.ts use remote bindings; CLOUDFLARE_ENV selects a
 * deploy environment. Either one means "this might be the real site": require two explicit
 * opt-ins before continuing.
 */
export const guardTarget = (scriptName: string, { writes }: { writes: boolean }) => {
  const risky = process.env.NODE_ENV === 'production' || Boolean(process.env.CLOUDFLARE_ENV)
  const target = describeTarget()
  if (risky && writes) {
    const allowed = hasFlag('--allow-remote') && process.env.SEED_CONFIRM === 'I_UNDERSTAND'
    if (!allowed) {
      console.error(
        [
          `✋ ${scriptName} refused to run.`,
          `   Target: ${target}`,
          `   NODE_ENV=${process.env.NODE_ENV ?? ''} CLOUDFLARE_ENV=${process.env.CLOUDFLARE_ENV ?? ''}`,
          '   This could write to the production database and bucket.',
          '   If that is really what you want, pass --allow-remote AND set SEED_CONFIRM=I_UNDERSTAND.',
        ].join('\n'),
      )
      process.exit(2)
    }
    console.warn(`⚠️  ${scriptName}: remote run explicitly allowed (--allow-remote, SEED_CONFIRM=I_UNDERSTAND).`)
  }
  console.log(`${scriptName}: using ${target}`)
}
