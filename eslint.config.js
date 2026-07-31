// @ts-check
import antfu from '@antfu/eslint-config'
import betterTailwind from 'eslint-plugin-better-tailwindcss'

export default antfu(
  {
    type: 'lib',
    pnpm: true,
    ignores: [
      'docs/.astro',
      'docs/dist',
      // Deliberately broken tailwind classes — run it explicitly with --no-ignore.
      'eslint-fixtures',
      // Vendored shadcn source, kept byte-identical to upstream so `shadcn add
      // --dry-run` still reports "identical" and surfaces real upstream changes. The
      // class-order and line-wrapping fixers below would rewrite these and destroy
      // that. src/components is ours and is linted normally.
      'packages/*/src/primitives',
      'packages/*/src/hooks',
    ],
  },
).append({
  name: 'cadenza/tailwind',
  files: ['**/*.tsx'],
  plugins: { 'better-tailwindcss': betterTailwind },
  settings: {
    'better-tailwindcss': {
      // The published styles.css deliberately omits `@import "tailwindcss"`, so it is
      // not a resolvable entry on its own — point at the docs stylesheet instead.
      entryPoint: 'docs/src/styles/global.css',
    },
  },
  rules: {
    // Auto-fixable.
    'better-tailwindcss/enforce-canonical-classes': 'error',
    'better-tailwindcss/enforce-consistent-class-order': 'error',
    'better-tailwindcss/enforce-consistent-important-position': 'error',
    'better-tailwindcss/enforce-consistent-line-wrapping': 'error',
    'better-tailwindcss/enforce-consistent-variable-syntax': 'error',
    'better-tailwindcss/enforce-consistent-variant-order': 'error',
    'better-tailwindcss/enforce-logical-properties': 'error',
    'better-tailwindcss/enforce-shorthand-classes': 'error',
    'better-tailwindcss/no-duplicate-classes': 'error',
    'better-tailwindcss/no-unnecessary-whitespace': 'error',

    // No autofix, but these catch classes that silently produce no CSS.
    'better-tailwindcss/no-concatenated-classes': 'error',
    'better-tailwindcss/no-conflicting-classes': 'error',
    'better-tailwindcss/no-deprecated-classes': 'error',
    'better-tailwindcss/no-unknown-classes': ['error', {
      ignore: ['not-content'], // Starlight opt-out class
    }],
  },
})
