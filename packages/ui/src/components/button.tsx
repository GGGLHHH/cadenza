import type { ComponentProps, ReactElement, RefAttributes } from 'react'
import { cn } from '#lib/utils'
import { Button, buttonVariants, LinkButton as LinkButtonPrimitive } from '#primitives/button'

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
// The primitive's type omits the ref half of RAC's public Link type; the spread
// already carries it (React 19), so only the type needs restating.
export type LinkButtonProps = ComponentProps<typeof LinkButtonPrimitive> & RefAttributes<HTMLAnchorElement>

/**
 * A link in button clothing — RAC's `Link` under `buttonVariants`.
 *
 * The variants express their disabled look as `disabled:` pseudo-class styles,
 * but a link is never a disabled `<button>`: RAC renders `isDisabled` as a
 * `<span>` carrying only `data-disabled`, which `:disabled` can never match.
 * Without the data-attribute mirror a disabled LinkButton looks exactly like a
 * live one.
 */
export function LinkButton({ className, ...props }: LinkButtonProps): ReactElement {
  return (
    <LinkButtonPrimitive
      className={cn('data-disabled:opacity-50', className)}
      {...props}
    />
  )
}

export { Button, buttonVariants }
