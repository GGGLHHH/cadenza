'use client'

import type { ReactElement } from 'react'
import { Progress as ProgressPrimitive } from '@base-ui/react/progress'
import { findComposedPart } from '#lib/find-part'
import { cn } from '#lib/utils'
import {
  ProgressIndicator as ProgressIndicatorPrimitive,
  ProgressLabel,
  ProgressTrack,
  ProgressValue,
} from '#primitives/progress'

export type ProgressProps = ProgressPrimitive.Root.Props
/** `status` is `'indeterminate'` (`value` is `null`), `'progressing'` or `'complete'` (`value === max`). Every part receives it. */
export type ProgressState = ProgressPrimitive.Root.State
export type ProgressStatus = ProgressPrimitive.Root.State['status']
export type ProgressTrackProps = ProgressPrimitive.Track.Props
export type ProgressIndicatorProps = ProgressPrimitive.Indicator.Props
export type ProgressLabelProps = ProgressPrimitive.Label.Props
/** `children` is a function of `(formattedValue, value)` — a payload, not the state. Omit it to print the formatted value. */
export type ProgressValueProps = ProgressPrimitive.Value.Props

/**
 * The published Progress family — Base UI's progress bar in shadcn's
 * base-nova skin, with the track present by default.
 *
 * ```tsx
 * <Progress value={56}>
 *   <ProgressLabel>Upload</ProgressLabel>
 *   <ProgressValue />
 * </Progress>
 * ```
 *
 * `value` is required and `null` means indeterminate (there is no
 * uncontrolled mode — a progress bar reports, it does not own, its number).
 * `max` / `min` scale it, `format` / `locale` shape the printed value, and
 * the status lands on every part as `data-indeterminate` /
 * `data-progressing` / `data-complete`.
 *
 * The root is not a re-export: shadcn's root always appends its own
 * `ProgressTrack` after `children`, so composing a track of your own — to
 * change its height, say — would render two. This root does what the vendored
 * one does unless a `ProgressTrack` is written as a direct child (or inside a
 * Fragment), in which case it steps aside completely. The four parts below it
 * are the vendored ones.
 *
 * `className` on every part lands on a Base UI slot, so the function form
 * `({ status }) => …` works throughout.
 */
export function Progress({ className, children, ...props }: ProgressProps): ReactElement {
  const composedTrack = findComposedPart(children, ProgressTrack) !== undefined
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn('flex flex-wrap gap-3', className)}
      {...props}
    >
      {children}
      {!composedTrack && (
        <ProgressTrack>
          <ProgressIndicator />
        </ProgressTrack>
      )}
    </ProgressPrimitive.Root>
  )
}

/**
 * The filled part of the track. Base UI sets its width from `value`; when the
 * bar is indeterminate there is no width to set and the vendored indicator
 * simply vanishes, so the seam gives that state a third-width segment that
 * slides along the track (`--animate-progress-indeterminate`, logical, so it
 * runs the reading direction in RTL too).
 */
export function ProgressIndicator({ className, ...props }: ProgressIndicatorProps): ReactElement {
  return (
    <ProgressIndicatorPrimitive
      className={cn(
        `
          data-indeterminate:animate-progress-indeterminate
          data-indeterminate:inline-1/3
        `,
        className,
      )}
      {...props}
    />
  )
}

export { ProgressLabel, ProgressTrack, ProgressValue }
