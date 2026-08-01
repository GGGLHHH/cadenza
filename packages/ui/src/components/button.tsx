import type { ComponentProps, ReactElement, RefAttributes } from 'react'
import { cn } from '#lib/utils'
import { Button as ButtonPrimitive, buttonVariants, LinkButton as LinkButtonPrimitive } from '#primitives/button'
import { Spinner } from './spinner'

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
 */
export type ButtonProps = ComponentProps<typeof ButtonPrimitive> & {
  /**
   * Alias of `isPending` — either being true marks the action as in flight.
   * `isPending` is React's vocabulary (`useTransition` / `useFormStatus`);
   * this one is for codebases that grew up on `loading` buttons.
   */
  isLoading?: boolean
}
// The primitive's type omits the ref half of RAC's public Link type; the spread
// already carries it (React 19), so only the type needs restating.
export type LinkButtonProps = ComponentProps<typeof LinkButtonPrimitive> & RefAttributes<HTMLAnchorElement>

/**
 * RAC's Button with a default pending look, Spectrum-style: the label goes
 * invisible in place — still sizing the button, still in the accessibility
 * tree — while a centred spinner cross-fades in over it. Width never changes,
 * so neighbours never shift; the only animation is 150ms of opacity, both
 * directions CSS-driven off `data-pending` (React unmounting can't cut the
 * exit short). No built-in anti-flicker delay: whether a fast operation
 * should show a spinner at all is the caller's call — delay setting
 * `isPending` if it matters. The wait cursor comes from styles.css, where
 * `data-pending` outranks the disabled not-allowed rule.
 *
 * The machinery mounts only while `isPending`/`isLoading` is *passed* (even
 * as false — that is what keeps the exit animation alive); buttons that never
 * use the feature render bare children. Function children are the caller
 * taking over the whole rendering (they see `isPending` in their render
 * props), so nothing is injected for them either.
 */
export function Button({ children, className, isPending, isLoading, ...props }: ButtonProps): ReactElement {
  const pendingCapable = (isPending ?? isLoading) !== undefined && typeof children !== 'function'
  return (
    <ButtonPrimitive
      className={cn(pendingCapable && 'relative', className)}
      isPending={isPending || isLoading}
      {...props}
    >
      {pendingCapable
        ? (
            <>
              <span
                aria-hidden
                data-slot="button-pending"
                className="
                  absolute inset-0 grid place-items-center opacity-0
                  transition-opacity duration-150
                  group-data-pending/button:opacity-100
                  motion-reduce:transition-none
                "
              >
                <Spinner className="block-[1em] inline-[1em]" />
              </span>
              <span
                data-slot="button-label"
                className="
                  inline-flex items-center gap-[inherit] transition-opacity
                  duration-150
                  group-data-pending/button:opacity-0
                  motion-reduce:transition-none
                "
              >
                {children}
              </span>
            </>
          )
        : children}
    </ButtonPrimitive>
  )
}

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

export { buttonVariants }
