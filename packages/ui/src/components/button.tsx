import type { ComponentProps } from 'react'
import { Button, buttonVariants, LinkButton } from '#primitives/button'

/**
 * The published Button.
 *
 * This file is the seam between shadcn's source and our public API. It decides what
 * `@gedatou/cadenza-ui` exposes, so the surface can change — rename a variant,
 * tighten a prop, wrap in a provider — without editing vendored code and breaking
 * the byte-identical check on src/primitives.
 *
 * It also keeps the dependency list honest: only primitives reachable from
 * src/components reach dist, so those are the only ones we declare dependencies for.
 *
 * Already earning it — the primitive inlines its props types rather than exporting
 * them, which leaves anyone wrapping Button with nothing to import.
 */
export type ButtonProps = ComponentProps<typeof Button>
export type LinkButtonProps = ComponentProps<typeof LinkButton>

export { Button, buttonVariants, LinkButton }
