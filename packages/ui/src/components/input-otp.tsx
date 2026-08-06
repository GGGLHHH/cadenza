import type { ComponentProps, ReactElement } from 'react'
import { cn } from '#lib/utils'
import {
  InputOTPGroup as InputOTPGroupPrimitive,
  InputOTP as InputOTPPrimitive,
  InputOTPSeparator as InputOTPSeparatorPrimitive,
  InputOTPSlot as InputOTPSlotPrimitive,
} from '#primitives/input-otp'

/**
 * `render` is dropped from the public surface. The `input-otp` package uses that
 * name for a *second content channel* — a function that replaces the whole
 * composition, mutually exclusive with children — while everywhere else in this
 * library `render` is Base UI's element replacement and takes a `ReactElement`.
 * One name, two meanings, and the wrong guess fails as a union error nobody can
 * read. Grouping stays composition: `InputOTPGroup` and `InputOTPSlot`.
 */
export type InputOTPProps = Omit<ComponentProps<typeof InputOTPPrimitive>, 'render'>
export type InputOTPGroupProps = ComponentProps<typeof InputOTPGroupPrimitive>
export type InputOTPSlotProps = ComponentProps<typeof InputOTPSlotPrimitive>
export type InputOTPSeparatorProps = ComponentProps<typeof InputOTPSeparatorPrimitive>

/**
 * The published InputOTP — a one-time-code field drawn as separate boxes.
 *
 * ```tsx
 * <InputOTP maxLength={6}>
 *   <InputOTPGroup>
 *     <InputOTPSlot index={0} /><InputOTPSlot index={1} /><InputOTPSlot index={2} />
 *   </InputOTPGroup>
 *   <InputOTPSeparator />
 *   <InputOTPGroup>
 *     <InputOTPSlot index={3} /><InputOTPSlot index={4} /><InputOTPSlot index={5} />
 *   </InputOTPGroup>
 * </InputOTP>
 * ```
 *
 * The only control in the library that is **not** built on Base UI: underneath
 * is the `input-otp` package, one real `<input>` stretched invisibly across the
 * boxes, which is what makes iOS/Android SMS autofill and paste work. Two
 * consequences worth knowing before reaching for a familiar prop:
 *
 * - **The protocol is React DOM's**, not the house one: `value` /
 *   `onChange(value: string)` — the callback takes the *string*, not an event,
 *   and there is no `eventDetails` second argument anywhere in this family.
 *   `onComplete(value)` fires when the last slot fills.
 * - **`maxLength` is required** and must match the number of slots you render.
 *   `index` on each slot is what binds it to a character, so the slots must be
 *   numbered from `0` without gaps across all the groups.
 *
 * The label channel is the ordinary one — `id` lands on that real input, so a
 * sibling `FieldLabel htmlFor` names it and focuses it, no box-only detour.
 *
 * `InputOTP` takes two class channels: `className` styles the invisible input,
 * `containerClassName` the visible row. Grouping is composition — one
 * `InputOTPGroup` per run of boxes, `InputOTPSeparator` between runs (it renders
 * an `IconMinus` and carries `role="separator"`).
 *
 * Active slots are marked `data-active="true"` rather than the empty-string form
 * the rest of the library uses — the vendored file writes the raw boolean and is
 * byte-locked. `styles.css` keeps a lenient variant for exactly this, so
 * `data-[active=true]:` is the selector to write here.
 */
export const InputOTP = InputOTPPrimitive as (props: InputOTPProps) => ReactElement

/**
 * Wrapped rather than re-exported: the vendored invalid recipe is keyed on
 * `has-aria-invalid` (an invalid element *inside the group*), but the real
 * `aria-invalid` lands on the one true `<input>` — a *sibling* of the groups
 * inside the container. These `in-[...]` variants bridge the container's
 * `:has(input[aria-invalid])` state onto the vendored hooks' exact recipe,
 * so form wiring on the input lights the boxes like every other control.
 */
export function InputOTPGroup({ className, ...props }: InputOTPGroupProps): ReactElement {
  return (
    <InputOTPGroupPrimitive
      className={cn(
        `
          in-[.cn-input-otp:has(input[aria-invalid="true"])]:ring-3
          in-[.cn-input-otp:has(input[aria-invalid="true"])]:ring-destructive/20
          dark:in-[.cn-input-otp:has(input[aria-invalid="true"])]:ring-destructive/40
        `,
        className,
      )}
      {...props}
    />
  )
}

export function InputOTPSlot({ className, ...props }: InputOTPSlotProps): ReactElement {
  return (
    <InputOTPSlotPrimitive
      className={cn(
        `
          in-[.cn-input-otp:has(input[aria-invalid="true"])]:border-destructive
          data-[active=true]:in-[.cn-input-otp:has(input[aria-invalid="true"])]:border-destructive
          data-[active=true]:in-[.cn-input-otp:has(input[aria-invalid="true"])]:ring-destructive/20
          dark:in-[.cn-input-otp:has(input[aria-invalid="true"])]:border-destructive/50
          dark:data-[active=true]:in-[.cn-input-otp:has(input[aria-invalid="true"])]:ring-destructive/40
        `,
        className,
      )}
      {...props}
    />
  )
}

/**
 * The gap between two `InputOTPGroup`s.
 *
 * Wrapped rather than re-exported: the vendored separator writes its own
 * `className` *before* the prop spread, so a caller-passed one replaced the
 * layout classes outright instead of adding to them — the icon lost its box and
 * its size. Merging here restores the ordinary "yours wins on conflict, mine
 * survives otherwise" behaviour.
 */
export function InputOTPSeparator({
  className,
  ...props
}: InputOTPSeparatorProps): ReactElement {
  return (
    <InputOTPSeparatorPrimitive
      className={cn(
        // Physical `size-4` on purpose, and copied from the vendored file
        // verbatim: tailwind-merge treats `size-*` and `block-*`/`inline-*` as
        // different groups, so the logical rewrite would stop a caller's
        // `size-6` from displacing this one — both would survive the merge, and
        // the logical pair sorts later in the sheet and wins. The whole point
        // of wrapping this part is that the caller's class gets to win.

        `
          flex items-center
          [&_svg:not([class*='size-'])]:block-4
          [&_svg:not([class*='size-'])]:inline-4
        `,
        className,
      )}
      {...props}
    />
  )
}
