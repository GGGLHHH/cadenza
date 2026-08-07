// @ts-check
import antfu from '@antfu/eslint-config'
import betterTailwind from 'eslint-plugin-better-tailwindcss'

export default antfu(
  {
    type: 'lib',
    pnpm: true,
    // @eslint-react + react-hooks + react-refresh. rules-of-hooks and
    // exhaustive-deps are the point; the react-x no-* rules also auto-migrate
    // React 19 idioms (forwardRef -> ref prop, Context.Provider -> Context).
    react: true,
    // Type-aware rules (projectService resolves each file's nearest tsconfig).
    // The point is ts/no-deprecated below: author-side @deprecated JSDoc
    // becomes visible at every call site, ours and consumers' alike.
    typescript: {
      tsconfigPath: 'tsconfig.json',
      overridesTypeAware: {
        // warn, not error: deprecation is a grace period by definition — the
        // symbol still works, the strikethrough + report is the migration nudge.
        'ts/no-deprecated': 'warn',
        // React 19's ReactNode includes Promise, so this rule's autofix turns
        // sync render callbacks into async ones — the callback then ALWAYS
        // returns a Promise and React suspends on every render. Too dangerous.
        'ts/promise-function-async': 'off',
      },
    },
    ignores: [
      'docs/.next',
      'docs/.source',
      'docs/next-env.d.ts',
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
  name: 'cadenza/env-checks',
  files: ['packages/*/src/**'],
  rules: {
    // Dev-only guards gate on `process.env.NODE_ENV` as a GLOBAL — the form
    // every bundler statically replaces and tree-shakes. Importing
    // node:process would defeat the replacement and drag a polyfill into
    // browser bundles.
    'node/prefer-global/process': ['error', 'always'],
  },
}).append({
  name: 'cadenza/react-overrides',
  files: ['**/*.tsx'],
  rules: {
    // HMR-only concern, and wrong for a library: seam files export a component
    // next to its variants and types on purpose. Only docs islands even have
    // Fast Refresh, and they are one component per file anyway.
    'react-refresh/only-export-components': 'off',
  },
}).append({
  name: 'cadenza/tailwind',
  files: ['**/*.tsx'],
  plugins: { 'better-tailwindcss': betterTailwind },
  settings: {
    'better-tailwindcss': {
      // The published styles.css deliberately omits `@import "tailwindcss"`, so it is
      // not a resolvable entry on its own — point at the docs stylesheet instead.
      entryPoint: 'docs/app/globals.css',
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
      // docs 的排版豁免类,定义在 docs/app/globals.css 的 components 层
      ignore: ['typeset', 'typeset-table'],
    }],
  },
}).append({
  name: 'cadenza/composition-mechanism',
  files: ['packages/ui/src/**'],
  rules: {
    // Marker-part detection (findComposedPart) walks children with
    // Children.toArray, and trigger wiring clones an id onto the caller's
    // element — deliberate house mechanisms, each documented at its site. The
    // "fragile code" these rules guard against IS the mechanism here.
    'react/no-children-to-array': 'off',
    'react/no-clone-element': 'off',
  },
})
