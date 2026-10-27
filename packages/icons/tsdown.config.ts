import { defineConfig } from 'tsdown'

export default defineConfig({
  // Unbundled: one module per icon behind a re-exporting index. A few icons
  // compute their animation tables at module scope, which a bundler cannot
  // prove pure — bundled into one file, those tables rode along with any
  // single icon. Unbundled (and `sideEffects: false`), an unused icon's module
  // is never loaded at all. No banner: each icon module and the renderer open
  // with their own `'use client'`, and the index only re-exports.
  entry: ['src/index.ts'],
  unbundle: true,
  dts: true,
  publint: true,
})
