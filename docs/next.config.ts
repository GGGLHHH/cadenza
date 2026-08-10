import type { NextConfig } from 'next'
import process from 'node:process'
import { createMDX } from 'fumadocs-mdx/next'

const withMDX = createMDX()

/**
 * Dev reads the packages' source; `next build` still goes through their dist.
 *
 * Watching the build output instead costs ~6s per edit — tsdown's d.ts pass
 * dominates the rebuild and is not incremental — and a dist change lands as a
 * full reload rather than Fast Refresh. Aliasing to source drops both, while
 * leaving the production build pointed at dist, so the docs site stays the
 * smoke test for what actually gets published.
 *
 * Only the published entry points need an entry: the packages' internal
 * cross-references go through Node's `imports` field (`#lib/utils`,
 * `#primitives/*`), which Turbopack resolves on its own.
 *
 * Every workspace package belongs here. A package left out is the only one
 * still reading `dist` in dev, so `pnpm dev` races its own `tsdown --watch`:
 * Turbopack compiles the demos before the first build lands and the import
 * fails until something triggers a recompile.
 */
const dev = process.env.NODE_ENV === 'development'
const sourceAlias = {
  '@gedatou/cadenza-form': '../packages/form/src/index.ts',
  '@gedatou/cadenza-ui': '../packages/ui/src/index.ts',
  '@gedatou/cadenza-utils': '../packages/utils/src/index.ts',
}

const config: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@gedatou/cadenza-form', '@gedatou/cadenza-ui', '@gedatou/cadenza-utils'],
  turbopack: {
    resolveAlias: dev ? sourceAlias : {},
  },
}

export default withMDX(config)
