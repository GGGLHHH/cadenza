import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  dts: true,
  publint: true,
  // Everything here is an interactive React Aria component, so the whole bundle
  // is a client module. Without this a Next.js server component cannot render
  // `<Button>` at all — it fails with "you're importing a module that depends on
  // useState". Upstream RAC omits it because shadcn's model copies source
  // carrying its own directive into the consumer's app; we ship a bundle, so the
  // directive has to travel with it. Rolldown puts a banner above the imports,
  // which is where the directive has to be.
  outputOptions: { banner: '\'use client\'' },
})
