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
 * The wildcard is not a third package — `packages/ui/src` self-references its
 * own internals (`@gedatou/cadenza-ui/lib/utils`, `/primitives/*`, `/hooks/*`),
 * which resolve through that package's tsconfig `paths` and are absent from its
 * `exports`. Reading source means resolving them here too. It does not swallow
 * the published `./styles.css` subpath: that import is a CSS `@import`, which
 * `@tailwindcss/postcss` resolves before Turbopack ever sees it.
 */
const dev = process.env.NODE_ENV === 'development'
const sourceAlias = {
  '@gedatou/cadenza-ui': '../packages/ui/src/index.ts',
  '@gedatou/cadenza-ui/*': '../packages/ui/src/*',
  '@gedatou/cadenza-utils': '../packages/utils/src/index.ts',
}

const config: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@gedatou/cadenza-ui', '@gedatou/cadenza-utils'],
  turbopack: {
    resolveAlias: dev ? sourceAlias : {},
  },
}

export default withMDX(config)
