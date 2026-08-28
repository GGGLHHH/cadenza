import type { ComponentProps, ReactElement } from 'react'
import {
  Empty,
  EmptyContent,
  EmptyDescription as EmptyDescriptionPrimitive,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '#primitives/empty'

/**
 * The published Empty family — the "nothing here yet" block: media, title,
 * description, then whatever action gets the user out of the empty state.
 *
 * ```tsx
 * <Empty>
 *   <EmptyHeader>
 *     <EmptyMedia variant="icon"><IconInbox /></EmptyMedia>
 *     <EmptyTitle>No threads yet</EmptyTitle>
 *     <EmptyDescription>Start a conversation to see it here.</EmptyDescription>
 *   </EmptyHeader>
 *   <EmptyContent><Button>New thread</Button></EmptyContent>
 * </Empty>
 * ```
 *
 * Every part is a plain `<div>`, so `className` is a string. Two vendored
 * quirks worth knowing before you fight them: `EmptyMedia` writes
 * `data-slot="empty-icon"` for both variants (`default | icon`) — the
 * variant itself is `data-variant`; and `EmptyDescription` is typed as a
 * `<p>` upstream but renders a `<div>` — the seam re-types it to the element
 * it is (a cast), so `ref` and event handlers line up.
 */
export type EmptyProps = ComponentProps<typeof Empty>
export type EmptyHeaderProps = ComponentProps<typeof EmptyHeader>
export type EmptyMediaProps = ComponentProps<typeof EmptyMedia>
/** `default` (transparent) or `icon` (a muted rounded tile sized for one icon). Mirrored as `data-variant`. */
export type EmptyMediaVariant = NonNullable<EmptyMediaProps['variant']>
export type EmptyTitleProps = ComponentProps<typeof EmptyTitle>
export type EmptyDescriptionProps = ComponentProps<'div'>
export type EmptyContentProps = ComponentProps<typeof EmptyContent>

export const EmptyDescription = EmptyDescriptionPrimitive as (props: EmptyDescriptionProps) => ReactElement

export { Empty, EmptyContent, EmptyHeader, EmptyMedia, EmptyTitle }
