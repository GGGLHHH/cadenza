// @ts-check
import antfu from '@antfu/eslint-config'

export default antfu(
  {
    type: 'lib',
    pnpm: true,
    ignores: [
      'docs/.astro',
      'docs/dist',
      // shadcn-generated, kept byte-identical to upstream so `shadcn add --dry-run`
      // still reports "identical" and surfaces real upstream changes.
      'packages/*/src/components',
    ],
  },
)
