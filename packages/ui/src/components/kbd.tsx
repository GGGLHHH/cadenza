import type { ComponentProps, ReactElement } from 'react'
import { Kbd, KbdGroup as KbdGroupPrimitive } from '#primitives/kbd'

/**
 * The published Kbd — a keyboard key, and a group of them.
 *
 * ```tsx
 * <KbdGroup><Kbd>⌘</Kbd><Kbd>K</Kbd></KbdGroup>
 * ```
 *
 * Both are real `<kbd>` elements with no Base UI state underneath, so
 * `className` is a plain string. Dropped inside a `TooltipPopup` the key
 * inverts its colours by itself (the vendored styles key on the popup's
 * `tooltip-content` slot); inside a `Button` or an `InputGroupAddon` it just
 * sits inline.
 *
 * `KbdGroup` is a cast, not a wrapper: the vendored part types its props as a
 * `<div>`'s but renders a `<kbd>` — the seam re-types it to the element it
 * actually is (`ComponentProps<'kbd'>`, ref included). Nothing else changes.
 */
export type KbdProps = ComponentProps<typeof Kbd>
export type KbdGroupProps = ComponentProps<'kbd'>

export const KbdGroup = KbdGroupPrimitive as (props: KbdGroupProps) => ReactElement

export { Kbd }
