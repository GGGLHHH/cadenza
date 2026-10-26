import { defineConfig } from 'tsdown'

// Everything here is an interactive Base UI component, so the whole bundle
// is a client module. Without this a Next.js server component cannot render
// `<Button>` at all — it fails with "you're importing a module that depends on
// useState". Upstream shadcn omits it because its model copies source
// carrying its own directive into the consumer's app; we ship a bundle, so the
// directive has to travel with it. Rolldown puts a banner above the imports,
// which is where the directive has to be.
const clientBanner = { banner: '\'use client\'' }

export default defineConfig([
  {
    entry: ['src/index.ts'],
    dts: true,
    publint: true,
    outputOptions: clientBanner,
  },
  {
    // `@gedatou/cadenza-ui/icons`, built apart and unbundled: one module per
    // icon behind a re-exporting index. A few icons compute their animation
    // tables at module scope, which a bundler cannot prove pure — bundled into
    // one file, those tables rode along with any single icon (27.8kB for one
    // Bell). Unbundled, an unused icon's module is never loaded at all.
    entry: { icons: 'src/icons/index.ts' },
    unbundle: true,
    clean: false,
    // No banner: each icon module keeps the `'use client'` its source opens
    // with, and the index only re-exports.
    dts: true,
  },
])
