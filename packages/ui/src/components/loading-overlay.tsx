import type { ComponentProps, ReactElement } from 'react'
import { cn } from '#lib/utils'
import { Spinner } from './spinner'

export interface LoadingOverlayProps extends ComponentProps<'div'> {
  /**
   * Content-plane vocabulary on purpose — "what you want to see has not
   * arrived", same word as the data adapters use. `pending` stays on the
   * action plane (Button).
   */
  isLoading?: boolean
}

/**
 * A region-level frosted-glass loading overlay: absolutely fills the nearest
 * positioned ancestor — **the parent must be `relative`** — dims and blurs the
 * content underneath, and centres a Spinner (replace it via `children`).
 *
 * Keep it rendered and toggle `isLoading`: both directions cross-fade in CSS
 * (150ms, motion-reduce exempt). `visibility` rides the same transition, so
 * the hidden overlay leaves the accessibility tree — no phantom "Loading"
 * announcements — and flips late on exit, letting the fade finish. Plain div
 * underneath, no Base UI state to be a function of: `className` is a string,
 * everything else spreads, `ref` included.
 *
 * It blocks the pointer, not the keyboard — Tab still reaches the controls
 * underneath (Mantine and antd behave the same). Truly sealing the region
 * means putting `inert` on the content, which is the caller's decision.
 */
export function LoadingOverlay({
  isLoading = false,
  className,
  children,
  ...props
}: LoadingOverlayProps): ReactElement {
  return (
    <div
      data-slot="loading-overlay"
      data-loading={isLoading || undefined}
      className={cn(
        // rounded-[inherit] is load-bearing: Chromium does not clip
        // backdrop-filter by an ancestor's rounded overflow — only the
        // element's OWN radius bounds the frost, anything else leaves square
        // corner notches (verified on the real Button at 6x magnification;
        // host transform/isolation do not help). Rounded hosts still add
        // overflow-hidden as the belt that shapes the painted background.
        `
          absolute inset-0 z-10 grid place-items-center rounded-[inherit]
          bg-background/60 backdrop-blur-sm transition-[opacity,visibility]
          duration-150
          motion-reduce:transition-none
        `,
        isLoading
          ? 'cursor-wait opacity-100'
          : `pointer-events-none invisible opacity-0`,
        className,
      )}
      {...props}
    >
      {children ?? <Spinner />}
    </div>
  )
}
