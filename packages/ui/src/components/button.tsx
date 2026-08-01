import type { ComponentProps, ReactElement, RefAttributes } from 'react'
import { cn } from '#lib/utils'
import { Button as ButtonPrimitive, buttonVariants, LinkButton as LinkButtonPrimitive } from '#primitives/button'
import { LoadingOverlay } from './loading-overlay'
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
 * RAC's Button pending on the same `LoadingOverlay` as everything else in the
 * library: the label stays in flow — still sizing the button, still the
 * accessible name — melting under a content blur while the flat scrim veils
 * it and a spinner centres on top (decorative, `aria-hidden`: RAC announces
 * the pending state itself). Width never changes, every fade runs in CSS off
 * `data-pending`, and there is no built-in anti-flicker delay — delay setting
 * `isPending` if a fast operation should not flash. The wait cursor comes
 * from styles.css, where `data-pending` outranks the disabled rule.
 *
 * The overlay mounts only while `isPending`/`isLoading` is *passed* (even as
 * false — that is what keeps the exit fade alive); buttons that never use the
 * feature render bare children. Function children are the caller taking over
 * the whole rendering (they see `isPending` in their render props), so
 * nothing is injected for them either.
 */
export function Button({ children, className, isPending, isLoading, ...props }: ButtonProps): ReactElement {
  const pendingCapable = (isPending ?? isLoading) !== undefined && typeof children !== 'function'
  return (
    <ButtonPrimitive
      // overflow-hidden shapes the flat scrim to the button's rounded padding
      // box — the same clip that shapes the background, so they coincide to
      // the pixel. Focus ring and outline are box-shadow/outline, which
      // clipping never touches.
      className={cn(pendingCapable && 'relative overflow-hidden', className)}
      isPending={isPending || isLoading}
      {...props}
    >
      {pendingCapable
        ? (
            <>
              {/* The frost, without backdrop-filter: a blur kernel sampling
                  up to the button's own silhouette smears halos along every
                  edge and corner (verified on the real button — inset,
                  transform, isolation, smaller radii all fail). Blurring the
                  CONTENT instead melts the label identically while the
                  button's edges never enter a kernel: the label stays put,
                  veiled and softly visible — covered, never replaced. */}
              <span
                data-slot="button-label"
                className="
                  inline-flex items-center gap-[inherit] transition-[filter]
                  duration-150
                  group-data-pending/button:blur-[2px]
                  motion-reduce:transition-none
                "
              >
                {children}
              </span>
              {/* rounded-none + backdrop-blur-none: the flat scrim is shaped
                  entirely by the host's overflow clip — the same geometry
                  that shapes the background, so they coincide to the pixel. */}
              <LoadingOverlay className="rounded-none backdrop-blur-none" isLoading={isPending || isLoading}>
                {/* text-foreground, not currentColor: inside the button the
                    inherited colour is the label's own, which camouflages the
                    spinner against the veiled label — foreground pairs with
                    the background-toned scrim in both themes. */}
                <Spinner
                  aria-hidden
                  className="text-foreground block-[1em] inline-[1em]"
                />
              </LoadingOverlay>
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
