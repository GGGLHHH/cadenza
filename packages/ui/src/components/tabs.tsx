'use client'

import type { VariantProps } from 'class-variance-authority'
import type { ComponentProps, ReactElement } from 'react'
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { cn } from '#lib/utils'
import {
  TabsContent,
  TabsList as TabsListPrimitive,
  tabsListVariants,
  Tabs as TabsPrimitive,
  TabsTrigger,
} from '#primitives/tabs'

/**
 * The published Tabs family.
 *
 * The seam renames the vendored parts: shadcn ships Radix-flavoured aliases
 * (`TabsTrigger` / `TabsContent`) over what are really Base UI components, and
 * our public surface follows Base UI's own flat naming, `<Family><Part>` —
 * `Tabs` / `TabsList` / `TabsTab` / `TabsPanel` (Base UI's flat exports are
 * `TabsTab`, not `Tab`: the family prefix is not ours to drop). The props are
 * Base UI's, passed straight through: `value` / `defaultValue` /
 * `onValueChange` on the root, `orientation`, `activateOnFocus` on the list,
 * `value` pairing a `TabsTab` with its `TabsPanel`.
 *
 * Composition is the whole API: the root takes no `items` and no config object,
 * `TabsTab` and `TabsPanel` pair up by `value`, and Base UI owns roving focus,
 * arrow-key navigation and `aria-controls` wiring. A tab set computed from data
 * is an ordinary `.map()`.
 */
export type TabsProps = ComponentProps<typeof TabsPrimitive>
export type TabsListProps = ComponentProps<typeof TabsListPrimitive> & VariantProps<typeof tabsListVariants>
export type TabsTabProps = ComponentProps<typeof TabsTrigger>
export type TabsPanelProps = ComponentProps<typeof TabsContent>

/**
 * The tab strip. Adds nothing but the positioning context `TabsIndicator` needs
 * — the vendored list already carries `group/tabs-list` and mirrors its variant
 * as `data-variant`, which is what the indicator styles itself off.
 */
export function TabsList({ className, ...props }: TabsListProps): ReactElement {
  return <TabsListPrimitive className={cn('relative', className)} {...props} />
}

export interface TabsIndicatorProps {
  className?: string
}

const INDICATOR_CLASSNAME = `
  pointer-events-none absolute inset-bs-0 inset-s-0 z-0
  group-data-[variant=default]/tabs-list:rounded-md
  group-data-[variant=default]/tabs-list:bg-background
  group-data-[variant=default]/tabs-list:shadow-sm
  group-data-[variant=line]/tabs-list:after:absolute
  group-data-[variant=line]/tabs-list:after:bg-foreground
  group-data-[variant=line]/tabs-list:after:content-['']
  dark:group-data-[variant=default]/tabs-list:border
  dark:group-data-[variant=default]/tabs-list:border-input
  dark:group-data-[variant=default]/tabs-list:bg-input/30
`

// The line variant hangs a 2px bar off the tab box — same geometry as the
// primitive's own `after`, so switching to the indicator does not move it.
const INDICATOR_LINE_CLASSNAME = `
  group-data-horizontal/tabs:after:inset-s-0
  group-data-horizontal/tabs:after:inset-e-0
  group-data-horizontal/tabs:after:inset-be-[-5px]
  group-data-horizontal/tabs:after:block-0.5
  group-data-vertical/tabs:after:inset-bs-0
  group-data-vertical/tabs:after:inset-be-0
  group-data-vertical/tabs:after:inset-e-[-4px]
  group-data-vertical/tabs:after:inline-0.5
`

const TAB_SELECTOR = '[data-slot="tabs-trigger"]'

/**
 * The sliding selection indicator: one element that moves between tabs instead
 * of each tab painting its own selected background.
 *
 * Base UI ships its own `Tabs.Indicator`, which follows the active tab. This one
 * follows, in order, the **hovered** tab, the **focused** tab, then the
 * **active** one — so it reads as "the tab you are about to get", and returns to
 * the active tab when the pointer leaves. That extra half is the whole reason it
 * exists: under `activateOnFocus={false}` the arrow keys move focus without
 * changing the selection, and an indicator pinned to the active tab would show
 * nothing at all while you navigate.
 *
 * Write it inside `TabsList`, in any position. The tabs' own selected background
 * is suppressed as soon as it is present (a `:has()` rule in styles.css).
 *
 * Everything it needs it reads off the DOM — `[data-active]`, `:focus-visible`,
 * and a pointer listener — rather than from a state context. The tabs are
 * siblings in the same element, so measuring them is a lookup, and this stays
 * one file with no wiring to keep in sync.
 */
export function TabsIndicator({ className }: TabsIndicatorProps): ReactElement {
  const ref = useRef<HTMLSpanElement>(null)
  const [box, setBox] = useState<{ x: number, y: number, width: number, height: number } | null>(null)
  const [hasPlaced, setHasPlaced] = useState(false)
  // The hovered tab is a ref, not state: it only ever feeds the measurement
  // below, which reads the DOM anyway. Storing it in state would re-render the
  // whole strip on every pointer move between tabs for nothing.
  const hoveredRef = useRef<HTMLElement | null>(null)

  const measure = useCallback(() => {
    const list = ref.current?.parentElement
    if (!list)
      return

    const target = hoveredRef.current
      ?? list.querySelector<HTMLElement>(`${TAB_SELECTOR}:focus-visible`)
      ?? list.querySelector<HTMLElement>(`${TAB_SELECTOR}[data-active]`)
    if (target === null)
      return
    // A hidden strip — inside a force-mounted panel, say — measures 0×0. Placing
    // there would count as the first placement, leaving the first real
    // measurement to animate in from the corner.
    if (target.offsetWidth === 0 && target.offsetHeight === 0)
      return

    // Anchored at the inline start, so RTL counts from the other edge.
    const isRtl = getComputedStyle(list).direction === 'rtl'
    const next = {
      x: isRtl ? -(list.clientWidth - target.offsetLeft - target.offsetWidth) : target.offsetLeft,
      y: target.offsetTop,
      width: target.offsetWidth,
      height: target.offsetHeight,
    }
    // A resize that did not move the target must not re-render — and this is
    // also what stops the every-render effect below from looping.
    setBox(prev => prev !== null
      && prev.x === next.x && prev.y === next.y
      && prev.width === next.width && prev.height === next.height
      ? prev
      : next)
  }, [])

  useLayoutEffect(() => {
    const list = ref.current?.parentElement
    if (!list)
      return

    const onPointerOver = (event: PointerEvent): void => {
      // Touch has no hover; a tap would otherwise leave the indicator stranded.
      if (event.pointerType === 'touch')
        return
      const tab = (event.target as Element | null)?.closest<HTMLElement>(TAB_SELECTOR) ?? null
      const isDisabled = tab !== null
        && (tab.hasAttribute('disabled') || tab.getAttribute('aria-disabled') === 'true')
      hoveredRef.current = isDisabled ? null : tab
      measure()
    }
    const onPointerLeave = (): void => {
      hoveredRef.current = null
      measure()
    }

    list.addEventListener('pointerover', onPointerOver)
    list.addEventListener('pointerleave', onPointerLeave)
    // Focus moves the indicator too, and which tab holds it is Base UI's
    // business — no React state changes when it moves, so listen for it.
    list.addEventListener('focusin', measure)
    list.addEventListener('focusout', measure)
    // Tab widths move under us: fonts finish loading, a badge count changes, the
    // container reflows. Re-measure rather than trust the first read.
    const observer = new ResizeObserver(measure)
    observer.observe(list)
    return () => {
      list.removeEventListener('pointerover', onPointerOver)
      list.removeEventListener('pointerleave', onPointerLeave)
      list.removeEventListener('focusin', measure)
      list.removeEventListener('focusout', measure)
      observer.disconnect()
    }
  }, [measure])

  // Deliberately every render, no dependency array: a controlled `value` change
  // moves the active tab without firing any of the listeners above. The identity
  // check inside `measure` is what keeps this from looping.
  useLayoutEffect(measure)

  // A tab strip must not slide in on load, so the transition is withheld until
  // the indicator has been placed once — otherwise the first transform lands
  // together with the transition and the indicator animates out of the strip's
  // corner. A later commit is not enough on its own: the browser sees style
  // changes, not React commits, and back-to-back writes with nothing in
  // between are one change. The flush is what separates them.
  useLayoutEffect(() => {
    if (box === null)
      return
    ref.current?.getBoundingClientRect()
    setHasPlaced(true)
  }, [box])

  const style = useMemo(
    () => box === null
      ? { opacity: 0 }
      : {
          transform: `translate(${box.x}px, ${box.y}px)`,
          inlineSize: box.width,
          blockSize: box.height,
        },
    [box],
  )

  return (
    <span
      aria-hidden
      data-slot="tabs-indicator"
      ref={ref}
      style={style}
      className={cn(
        INDICATOR_CLASSNAME,
        INDICATOR_LINE_CLASSNAME,
        hasPlaced && `
          transition-[transform,inline-size,block-size] duration-200 ease-out
          motion-reduce:transition-none
        `,
        className,
      )}
    />
  )
}

export const Tabs = TabsPrimitive

/** Base UI's `Tabs.Tab`, unchanged: `value` pairs it with a `TabsPanel`, plus `disabled`. */
export const TabsTab = TabsTrigger

export const TabsPanel = TabsContent

export { tabsListVariants }
