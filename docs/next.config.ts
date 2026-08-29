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
  '@gedatou/cadenza-ai': '../packages/ai/src/index.ts',
  '@gedatou/cadenza-ai/mock': '../packages/ai/src/mock/index.ts',
  '@gedatou/cadenza-ai/server': '../packages/ai/src/server/index.ts',
  '@gedatou/cadenza-ai/providers/openai': '../packages/ai/src/providers/openai.ts',
  '@gedatou/cadenza-ai/providers/anthropic': '../packages/ai/src/providers/anthropic.ts',
  '@gedatou/cadenza-ai/providers/gemini': '../packages/ai/src/providers/gemini.ts',
  '@gedatou/cadenza-ai/providers/grok': '../packages/ai/src/providers/grok.ts',
  '@gedatou/cadenza-ai/providers/groq': '../packages/ai/src/providers/groq.ts',
  '@gedatou/cadenza-ai/providers/mistral': '../packages/ai/src/providers/mistral.ts',
  '@gedatou/cadenza-ai/providers/openrouter': '../packages/ai/src/providers/openrouter.ts',
  '@gedatou/cadenza-ai/providers/vercel-gateway': '../packages/ai/src/providers/vercel-gateway.ts',
  '@gedatou/cadenza-ai/providers/llmgateway': '../packages/ai/src/providers/llmgateway.ts',
  '@gedatou/cadenza-ai/providers/bedrock': '../packages/ai/src/providers/bedrock.ts',
  '@gedatou/cadenza-ai/providers/deepseek': '../packages/ai/src/providers/deepseek.ts',
  '@gedatou/cadenza-ai/providers/vertex': '../packages/ai/src/providers/vertex.ts',
  '@gedatou/cadenza-ai/providers/ollama': '../packages/ai/src/providers/ollama.ts',
  '@gedatou/cadenza-ai/providers/openai-compatible': '../packages/ai/src/providers/openai-compatible.ts',
  '@gedatou/cadenza-ai/providers/byteplus': '../packages/ai/src/providers/byteplus.ts',
  '@gedatou/cadenza-form': '../packages/form/src/index.ts',
  '@gedatou/cadenza-ui': '../packages/ui/src/index.ts',
  '@gedatou/cadenza-utils': '../packages/utils/src/index.ts',
}

const config: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@gedatou/cadenza-ai', '@gedatou/cadenza-form', '@gedatou/cadenza-ui', '@gedatou/cadenza-utils'],
  turbopack: {
    resolveAlias: dev ? sourceAlias : {},
  },
}

export default withMDX(config)
