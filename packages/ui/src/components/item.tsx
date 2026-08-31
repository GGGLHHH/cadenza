import type { ComponentProps } from 'react'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemGroup,
  ItemHeader,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from '#primitives/item'

/**
 * The published Item family — one row of content: media, title and
 * description, and an actions area; optional header and footer spanning the
 * row. `ItemGroup` stacks rows (it is `role="list"`; give each `Item` a
 * `render={<li />}` or `role="listitem"` when that semantics matters), and
 * `ItemSeparator` rules between them.
 *
 * ```tsx
 * <ItemGroup>
 *   <Item render={<a href="/threads/1" />}>
 *     <ItemMedia variant="icon"><IconMessage /></ItemMedia>
 *     <ItemContent>
 *       <ItemTitle>Rehearsal schedule</ItemTitle>
 *       <ItemDescription>Yesterday · 12 messages</ItemDescription>
 *     </ItemContent>
 *     <ItemActions><Button variant="ghost" size="icon-xs" aria-label="More">…</Button></ItemActions>
 *   </Item>
 * </ItemGroup>
 * ```
 *
 * `Item` and `ItemMedia` carry the two knobs: `variant` (`default | outline |
 * muted`; media: `default | icon | image`) and `size` (`default | sm | xs`),
 * all mirrored as `data-variant` / `data-size`. `Item` renders through
 * `useRender`, so `render` turns it into a link or a button with the hover
 * and focus styling following; its `className` is a string (cva route —
 * `useRender.ComponentProps<'div'>` already says so), as is every other
 * part's (plain divs; `ItemDescription` is a real `<p>`). The one exception
 * is `ItemSeparator`, which sits on the Base UI `Separator` slot and keeps
 * the function `className` form.
 *
 * This is the row primitive the `ThreadList` in `@gedatou/cadenza-ai` is
 * built on; it is also what to reach for over `Field` when the row shows
 * content rather than a form control.
 */
export type ItemProps = ComponentProps<typeof Item>
/** The three surfaces. Mirrored as `data-variant`. */
export type ItemVariant = NonNullable<ItemProps['variant']>
/** Row density. Mirrored as `data-size`; `ItemGroup` tightens its gap to match. */
export type ItemSize = NonNullable<ItemProps['size']>
export type ItemGroupProps = ComponentProps<typeof ItemGroup>
export type ItemSeparatorProps = ComponentProps<typeof ItemSeparator>
export type ItemMediaProps = ComponentProps<typeof ItemMedia>
/** `default`, an `icon` tile, or a cropped `image`. Mirrored as `data-variant`. */
export type ItemMediaVariant = NonNullable<ItemMediaProps['variant']>
export type ItemContentProps = ComponentProps<typeof ItemContent>
export type ItemTitleProps = ComponentProps<typeof ItemTitle>
export type ItemDescriptionProps = ComponentProps<typeof ItemDescription>
export type ItemActionsProps = ComponentProps<typeof ItemActions>
export type ItemHeaderProps = ComponentProps<typeof ItemHeader>
export type ItemFooterProps = ComponentProps<typeof ItemFooter>

export {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemGroup,
  ItemHeader,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
}
