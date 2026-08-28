import { readdirSync } from 'node:fs'
import { defineConfig } from 'tsdown'

// One entry per provider preset: each file only imports its own @tanstack/ai-<id>
// (an optional peer), so a consumer who installs two adapters bundles two.
const providers = Object.fromEntries(
  readdirSync('src/providers')
    .filter(f => f.endsWith('.ts'))
    .map(f => [`providers/${f.replace(/\.ts$/, '')}`, `src/providers/${f}`]),
)

export default defineConfig({
  entry: {
    'index': 'src/index.ts',
    'server/index': 'src/server/index.ts',
    'mock/index': 'src/mock/index.ts',
    ...providers,
  },
  dts: true,
  publint: true,
  // Only the root and the mock entry are client modules (hooks, components, a
  // ChatFetcher). `server` and `providers/*` run inside route handlers — a
  // 'use client' banner there would make React treat them as client modules.
  // ChunkAddonFunction's ctx is `{ format, fileName }`; there is no `name`.
  outputOptions: {
    banner: ({ fileName }) => (/^(?:index|mock\/index)\.mjs$/.test(fileName) ? '\'use client\'' : ''),
  },
  // dependencies / peerDependencies are externalised by default; this only
  // covers the optional-peer adapters by pattern so a stray import never bundles an SDK.
  external: [/^@tanstack\/ai-/, /^@gedatou\//],
})
