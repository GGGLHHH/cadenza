'use client'

import type { ComponentProps, ReactElement } from 'react'
import type { TabListState } from 'react-aria-components'
import { cn } from '@gedatou/cadenza-ui/lib/utils'
import {
  Tabs,
  TabsContent,
  TabsList,
  tabsListVariants,
  TabsTrigger,
} from '@gedatou/cadenza-ui/primitives/tabs'
import { Children, isValidElement, use, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { TabListStateContext, TabsContext } from 'react-aria-components'

/**
 * The published Tabs family.
 *
 * The seam renames the vendored parts: shadcn ships Radix-flavoured aliases
 * (`TabsList` / `TabsTrigger` / `TabsContent`) over what are really React Aria
 * components, and our public surface follows React Aria instead —
 * `Tabs` / `TabList` / `Tab` / `TabPanel`. Same for the props: `selectedKey` /
 * `defaultSelectedKey` / `onSelectionChange`, `orientation`,
 * `keyboardActivation`, `disabledKeys`, `isDisabled` are RAC's, passed straight
 * through.
 *
 * Composition is the whole API: the root takes no `items` and no config object
 * (RAC omits them there), `Tab` and `TabPanel` pair up by `id`, and RAC owns
 * roving focus, arrow-key navigation and `aria-controls` wiring. `TabList`
 * still accepts RAC's dynamic-collection form — `items` plus function children
 * — for tab sets computed from data.
 */
export type TabsProps = ComponentProps<typeof Tabs>
export type TabListProps = ComponentProps<typeof TabsList>
export type TabProps = ComponentProps<typeof TabsTrigger>
export type TabPanelProps = ComponentProps<typeof TabsContent>

/**
 * The tab-list state — React Aria's state layer, read through RAC's own
 * context. Custom parts (a counter badge, a "next tab" button) take
 * `selectedKey` / `setSelectedKey` / `collection` from here instead of having
 * it threaded down as props.
 *
 * Write those parts as **direct children of `Tabs`**, and return `null` when
 * this returns `null`. Two RAC behaviours make that the rule:
 *
 * - `Tabs` renders its children once, hidden, to build the tab collection.
 *   There is no state yet in that pass, so it reads `null` — exactly how RAC's
 *   own parts detect it.
 * - Inside a `TabPanel` it is `null` on purpose: RAC resets the tabs contexts
 *   there so a nested `Tabs` cannot inherit the outer one's state. Reach for
 *   `TabPanel`'s render props (`{({ state }) => …}`) when you need it there.
 */
export function useTabsState<T extends object = object>(): TabListState<T> | null {
  return use(TabListStateContext) as TabListState<T> | null
}

/**
 * The tab strip.
 *
 * It wraps RAC's `TabList` in a positioned container so `TabIndicator` has
 * something to place itself against, and owns the hovered-tab state the
 * indicator follows. The container exists because RAC's `TabList` renders only
 * its collection — it sets `children: null` and emits the collection instead —
 * so an indicator written between the tabs would silently vanish.
 * `TabIndicator` is therefore a marker: we lift it out of `children` here and
 * render it as the list's sibling, which is also where it can paint behind the
 * tabs without being clipped by the strip's own background.
 */
export function TabList({
  className,
  children,
  variant = 'default',
  ...props
}: TabListProps): ReactElement {
  // Function children are RAC's dynamic collection form; nothing to lift there.
  let indicator: ReactElement | null = null
  const tabs = typeof children === 'function'
    ? children
    : Children.map(children, (child) => {
        if (!isValidElement(child) || child.type !== TabIndicator)
          return child
        indicator = <TabIndicatorImpl {...(child.props as TabIndicatorProps)} />
        return null
      })

  return (
    // The variant is mirrored here because the indicator is the list's sibling,
    // so `group/tabs-list` — which lives on the list itself — cannot reach it.
    <div
      className="group/tab-strip relative self-start inline-fit"
      data-slot="tab-list-container"
      data-variant={variant}
    >
      <TabsList className={className} variant={variant} {...props}>
        {tabs}
      </TabsList>
      {indicator}
    </div>
  )
}

export interface TabIndicatorProps {
  className?: string
}

const INDICATOR_CLASSNAME = `
  pointer-events-none absolute inset-bs-0 inset-s-0 z-0
  group-data-[variant=default]/tab-strip:rounded-md
  group-data-[variant=default]/tab-strip:bg-background
  group-data-[variant=default]/tab-strip:shadow-sm
  group-data-[variant=line]/tab-strip:after:absolute
  group-data-[variant=line]/tab-strip:after:bg-foreground
  group-data-[variant=line]/tab-strip:after:content-['']
  dark:group-data-[variant=default]/tab-strip:border
  dark:group-data-[variant=default]/tab-strip:border-input
  dark:group-data-[variant=default]/tab-strip:bg-input/30
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

/**
 * The sliding selection indicator: one element that moves between tabs instead
 * of each tab painting its own selected background.
 *
 * It follows, in order, the **hovered** tab, the **focused** tab (only while
 * the strip actually has focus — which is what makes `keyboardActivation="manual"`
 * readable), then the **selected** one. So it reads as "the tab you are about
 * to get", and returns to the selected tab when the pointer leaves.
 *
 * Write it inside `TabList`, in any position; the tabs' own selected background
 * is suppressed as soon as it is present (a `:has()` rule in styles.css). It
 * renders nothing itself — see `TabList` for why it is a marker.
 */
export function TabIndicator(_props: TabIndicatorProps): null {
  return null
}

function TabIndicatorImpl(props: TabIndicatorProps): ReactElement | null {
  // RAC renders the whole subtree once, hidden, to build its collection; the
  // state context is null during that pass. RAC's own parts guard the same way.
  const state = useTabsState()
  return state === null ? null : <TabIndicatorInner {...props} state={state} />
}

function TabIndicatorInner({
  className,
  state,
}: TabIndicatorProps & { state: TabListState<object> }): ReactElement {
  const ref = useRef<HTMLSpanElement>(null)
  const [hoveredKey, setHoveredKey] = useState<string | null>(null)
  const [box, setBox] = useState<{ x: number, y: number, width: number, height: number } | null>(null)
  const [hasPlaced, setHasPlaced] = useState(false)

  const { selectionManager, selectedKey } = state
  const focusedKey = selectionManager.isFocused ? selectionManager.focusedKey : null
  const activeKey = hoveredKey ?? focusedKey ?? selectedKey

  // Hover is read off the DOM, not from a context each Tab writes to: RAC
  // builds its collection from a first, hidden render pass, so the props stored
  // on a Tab node — and any callback closing over React state — belong to that
  // throwaway pass. A pointer listener on the strip sidesteps the whole thing.
  useLayoutEffect(() => {
    const container = ref.current?.parentElement
    if (!container)
      return

    const onPointerOver = (event: PointerEvent): void => {
      // Touch has no hover; a tap would otherwise leave the indicator stranded.
      if (event.pointerType === 'touch')
        return
      const tab = (event.target as Element | null)?.closest<HTMLElement>('[data-key]')
      setHoveredKey(
        tab === null || tab === undefined || tab.getAttribute('aria-disabled') === 'true'
          ? null
          : (tab.dataset.key ?? null),
      )
    }
    const onPointerLeave = (): void => setHoveredKey(null)

    container.addEventListener('pointerover', onPointerOver)
    container.addEventListener('pointerleave', onPointerLeave)
    return () => {
      container.removeEventListener('pointerover', onPointerOver)
      container.removeEventListener('pointerleave', onPointerLeave)
    }
  }, [])

  useLayoutEffect(() => {
    const list = ref.current?.parentElement
    if (!list || activeKey === null)
      return

    const measure = (): void => {
      const tab = list.querySelector<HTMLElement>(`[data-key="${CSS.escape(String(activeKey))}"]`)
      if (!tab)
        return
      // A hidden strip — inside a force-mounted panel, say — measures 0×0.
      // Placing there would count as the first placement, leaving the first
      // real measurement to animate in from the corner.
      if (tab.offsetWidth === 0 && tab.offsetHeight === 0)
        return
      // Anchored at the inline start, so RTL counts from the other edge.
      const isRtl = getComputedStyle(list).direction === 'rtl'
      const next = {
        x: isRtl ? -(list.clientWidth - tab.offsetLeft - tab.offsetWidth) : tab.offsetLeft,
        y: tab.offsetTop,
        width: tab.offsetWidth,
        height: tab.offsetHeight,
      }
      // A resize that did not move this tab must not re-render.
      setBox(prev => prev !== null
        && prev.x === next.x && prev.y === next.y
        && prev.width === next.width && prev.height === next.height
        ? prev
        : next)
    }

    measure()
    // Tab widths move under us: fonts finish loading, a badge count changes,
    // the container reflows. Re-measure rather than trust the first read.
    const observer = new ResizeObserver(measure)
    observer.observe(list)
    for (const tab of list.querySelectorAll('[data-key]'))
      observer.observe(tab)
    return () => observer.disconnect()
    // collection.size re-attaches the observers when tabs are added or removed.
  }, [activeKey, state.collection.size])

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
      data-slot="tab-indicator"
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

export {
  /** RAC's `Tab`, unchanged: `id` pairs it with a `TabPanel`, plus `isDisabled` / `href`. */
  TabsTrigger as Tab,
  tabsListVariants as tabListVariants,
  TabsContent as TabPanel,
  Tabs,
  /**
   * React Aria's prop-providing context. A wrapper can set defaults for a whole
   * subtree (`orientation`, `keyboardActivation`, …) without threading props:
   * `<TabsContext value={{ orientation: 'vertical' }}>…</TabsContext>`.
   */
  TabsContext,
}
