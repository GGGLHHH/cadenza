/**
 * Fixture for eslint-plugin-better-tailwindcss. Every enabled rule has one line here.
 *
 *   npx eslint --no-ignore eslint-fixtures/tailwind-rules.tsx          # see all 14 fire
 *   npx eslint --no-ignore --fix eslint-fixtures/tailwind-rules.tsx    # see what autofix does
 *
 * It is in eslint.config.js `ignores` so `pnpm run lint` stays green — the file exists
 * to be broken. After --fix, `git checkout eslint-fixtures` puts it back.
 */
import type { ReactElement } from 'react'

export function Fixture({ size }: { size: string }): ReactElement {
  return (
    <>
      {/* enforce-consistent-class-order — layout/spacing/colour have a canonical order */}
      <div className="text-sm flex bg-primary items-center" />

      {/* no-unnecessary-whitespace — double space between classes */}
      <div className="p-4  flex" />

      {/* no-duplicate-classes — p-4 twice */}
      <div className="p-4 text-sm p-4" />

      {/* enforce-shorthand-classes — mt-2 mb-2 collapses to my-2 */}
      <div className="mt-2 mb-2" />

      {/* enforce-shorthand-classes — four sides collapse to p-1 */}
      <div className="pt-1 pr-1 pb-1 pl-1" />

      {/* enforce-canonical-classes — w-[100%] has a built-in equivalent (w-full) */}
      <div className="w-[100%]" />

      {/* enforce-logical-properties — pl/mr are physical, ps/me are logical */}
      <div className="pl-3 mr-2" />

      {/* enforce-consistent-important-position — v4 moved ! to the end */}
      <div className="!flex" />

      {/* enforce-consistent-variable-syntax — v4 prefers bg-(--my-color) over [--my-color] */}
      <div className="bg-[--my-color]" />

      {/* enforce-consistent-variant-order — responsive variant sorts before state */}
      <div className="hover:md:bg-muted" />

      {/* no-deprecated-classes — both were renamed in v4 */}
      <div className="flex-shrink-0 overflow-ellipsis" />

      {/* no-unknown-classes — silently produces no CSS without this rule */}
      <div className="bg-totally-made-up" />

      {/* no-conflicting-classes — two display utilities on one element */}
      <div className="flex block" />

      {/* no-concatenated-classes — Tailwind's scanner cannot see a built string */}
      <div className={`p-${size}`} />

      {/* enforce-consistent-line-wrapping — too long for one line */}
      <div className="flex items-center justify-between gap-2 rounded-lg border border-input bg-background p-4 text-sm shadow-xs transition-all hover:bg-muted focus-visible:ring-2" />
    </>
  )
}
