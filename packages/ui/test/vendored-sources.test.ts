// @vitest-environment node
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, it } from 'vitest'

/**
 * src/primitives and src/hooks are shadcn's source, not ours — raw material we
 * build on, never the published surface. Every byte in there should have been
 * written by `shadcn add`; a hand edit is a bug, and a silent reformat destroys
 * the `--dry-run … identical` signal that tells us whether upstream has moved.
 *
 * When you legitimately re-pull (`shadcn add -o`), accept the new hashes:
 *   pnpm test -u
 *
 * This pins the files against local edits. It says nothing about upstream, which
 * only the registry knows — for that, run:
 *   npx shadcn@latest add -c packages/ui <name> --dry-run
 */
const SRC = fileURLToPath(new URL('../src', import.meta.url))
const VENDORED = ['primitives', 'hooks']

function hashDir(dir: string): Record<string, string> {
  return Object.fromEntries(
    readdirSync(join(SRC, dir))
      .sort()
      .map(file => [
        `${dir}/${file}`,
        createHash('sha256').update(readFileSync(join(SRC, dir, file))).digest('hex').slice(0, 16),
      ]),
  )
}

it('vendored shadcn sources are unmodified', () => {
  const files = Object.assign({}, ...VENDORED.map(hashDir)) as Record<string, string>
  expect(Object.keys(files).length).toBeGreaterThan(0)
  expect(files).toMatchSnapshot()
})
