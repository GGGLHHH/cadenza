import type { ComponentProps, ReactElement } from 'react'
import { cn, dataAttr } from '#lib/utils'
import { Button as ButtonPrimitive } from '#primitives/button'
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
export type ButtonProps = Omit<ComponentProps<typeof ButtonPrimitive>, 'className'> & {
  /**
   * Marks the action as in flight: the button stays focusable but stops
   * responding, and its label is veiled by a spinner.
   */
  pending?: boolean
  /**
   * The vendored button funnels this through `cva`, which drops a function
   * instead of resolving it. Narrowed to a string here so the type does not
   * promise a contract the element cannot keep — to style off state, use the
   * `data-*` attributes Base UI writes (`data-disabled`, `data-pending`,
   * `data-popup-open`) rather than a render-props className.
   */
  className?: string
}

/**
 * Pending rides the same `LoadingOverlay` as everything else in the library: the
 * label stays in flow — still sizing the button, still the accessible name —
 * melting under a content blur while the flat scrim veils it and a spinner
 * centres on top. Width never changes, every fade runs in CSS off `data-pending`,
 * and there is no built-in anti-flicker delay — delay setting `pending` if a fast
 * operation should not flash. The wait cursor comes from styles.css, where
 * `data-pending` outranks the disabled rule.
 *
 * The overlay mounts only while `pending` is *passed* (even as false — that is
 * what keeps the exit fade alive); buttons that never use the feature render
 * bare children.
 *
 * The three things a pending button must do, none of which Base UI has a prop
 * for — React Aria's `isPending` bundled them, so the seam reassembles it:
 *
 * - **Stays focusable.** `disabled` + `focusableWhenDisabled` makes Base UI write
 *   `aria-disabled` rather than the `disabled` attribute, so the button is inert
 *   without being yanked out of the tab order mid-action. Clicks and keys are
 *   suppressed either way.
 * - **Stops submitting.** A pending `type="submit"` becomes `type="button"`, or
 *   pressing Enter in a sibling text input would submit the form the button is
 *   busy submitting.
 * - **Says so.** `aria-busy` is the state; unlike React Aria there is no
 *   assertive re-announcement on the transition, which needed a live-region
 *   singleton and had nothing new to read out — our spinner is decorative and
 *   the library ships no text in any language.
 */
export function Button({
  children,
  className,
  disabled,
  pending,
  type,
  ...props
}: ButtonProps): ReactElement {
  return (
    <ButtonPrimitive
      // overflow-hidden shapes the flat scrim to the button's rounded padding
      // box — the same clip that shapes the background, so they coincide to
      // the pixel. Focus ring and outline are box-shadow/outline, which
      // clipping never touches.
      className={cn(pending !== undefined && 'relative overflow-hidden', className)}
      disabled={disabled || pending}
      focusableWhenDisabled={pending === true && disabled !== true}
      type={type === 'submit' && pending === true ? 'button' : type}
      {...props}
      // Derived from `pending`, so after the spread: a caller cannot half-set
      // the state by passing one of these on its own.
      aria-busy={pending === true || undefined}
      data-pending={dataAttr(pending)}
    >
      {pending === undefined
        ? children
        : (
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
              <LoadingOverlay className="rounded-none backdrop-blur-none" loading={pending}>
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
          )}
    </ButtonPrimitive>
  )
}

export type LinkButtonProps = Omit<ComponentProps<'a'>, 'className'>
  & Pick<ButtonProps, 'className' | 'size' | 'variant'>
  & {
    /** Renders the link inert: no `href`, not focusable, not activatable. */
    disabled?: boolean
  }

/**
 * A link in button clothing — an `<a>` driven by Base UI's Button through
 * `nativeButton={false}`, the same route the vendored `PaginationLink` takes.
 *
 * Base UI supplies what a hand-rolled `<a className={buttonVariants()}>` would
 * not: `aria-disabled` and `tabIndex={-1}` while disabled, plus the suppressed
 * activation. The `href` comes off on top of that, because `aria-disabled` alone
 * still leaves a link openable from the context menu.
 *
 * The variants express their disabled look as `disabled:` pseudo-class styles,
 * which an anchor can never match — hence the `data-disabled:` mirror.
 */
export function LinkButton({ className, disabled, href, size, variant, ...props }: LinkButtonProps): ReactElement {
  return (
    <ButtonPrimitive
      className={cn('data-disabled:opacity-50', className)}
      disabled={disabled}
      nativeButton={false}
      render={<a href={disabled === true ? undefined : href} {...props} />}
      size={size}
      variant={variant}
    />
  )
}

export { buttonVariants } from '#primitives/button'
