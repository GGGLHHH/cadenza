'use client'

import type { VariantProps } from 'class-variance-authority'
import type { ReactElement } from 'react'
import { Tabs as AnimatedTabs } from '@animate-ui/react/primitives/base-ui/tabs'
import { cn } from '#lib/utils'
import { tabsListVariants } from '#primitives/tabs'

/**
 * The published Tabs family.
 *
 * The seam renames the vendored parts: shadcn ships Radix-flavoured aliases
 * (`TabsTrigger` / `TabsContent`) over what are really Base UI components, and
 * our public surface follows Base UI's own flat naming, `<Family><Part>` —
 * `Tabs` / `TabsList` / `TabsTab` / `TabsPanel` (Base UI's flat exports are
 * `TabsTab`, not `Tab`: the family prefix is not ours to drop). The props are
 * Base UI's, passed straight through: `value` / `defaultValue` /
 * `onValueChange` / `orientation` on the root, `activateOnFocus` on the list,
 * `value` pairing a `TabsTab` with its `TabsPanel`.
 *
 * Composition is the whole API: the root takes no `items` and no config object,
 * `TabsTab` and `TabsPanel` pair up by `value`, and Base UI owns roving focus,
 * arrow-key navigation and `aria-controls` wiring. A tab set computed from data
 * is an ordinary `.map()`.
 *
 * The parts are animate-ui's: its list slides one indicator between tabs
 * (cloning the selected tab's box look and hiding the tab's own), and its
 * panels cross-fade and shift toward the newly active tab. The vendored parts
 * supply the classes only.
 */
export type TabsProps = AnimatedTabs.Root.Props
export type TabsListProps = AnimatedTabs.List.Props & VariantProps<typeof tabsListVariants> & {
  /**
   * animate-ui's sliding indicator is present by default — it is this
   * library's tabs look. `indicator={false}` removes it and the tabs paint
   * their own selected state again. A composed `TabsIndicator` also turns it
   * off.
   */
  indicator?: boolean
}
export type TabsTabProps = AnimatedTabs.Tab.Props
export type TabsIndicatorProps = AnimatedTabs.Indicator.Props
export type TabsPanelProps = AnimatedTabs.Panel.Props & {
  /**
   * The activation animation is present by default. `animated={false}` makes
   * it instant; `transition` / `exitTransition` (Motion) retime it.
   */
  animated?: boolean
}

/**
 * The root. Renders Base UI's Root (through animate-ui), NOT the vendored
 * wrapper — the vendored root destructures `orientation` into a cosmetic
 * `data-orientation` attribute and never forwards it to Base UI (upstream
 * shadcn bug), which silently breaks everything vertical: `aria-orientation`,
 * the arrow-key axis, and the activation direction. The one classname line
 * below is the vendored root's, kept in sync by hand; Base UI writes the real
 * `data-orientation` itself, and the styling variants key off the same
 * attribute.
 */
export function Tabs({ className, ...props }: TabsProps): ReactElement {
  return (
    <AnimatedTabs.Root
      className={cn(`
        group/tabs flex gap-2
        data-horizontal:flex-col
      `, className)}
      data-slot="tabs"
      {...props}
    />
  )
}

/**
 * The tab strip, the vendored list's classes on animate-ui's List, which
 * renders the sliding indicator itself (two states: default present;
 * `indicator={false}` or a composed `TabsIndicator` → gone).
 */
export function TabsList({ children, className, indicator = true, variant = 'default', ...props }: TabsListProps): ReactElement {
  return (
    <AnimatedTabs.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), 'relative', className)}
      {...props}
    >
      {children}
      {/* animate-ui steps its own indicator aside for any composed one; a
          hidden one is how "no indicator" is said. */}
      {!indicator && <AnimatedTabs.Indicator hidden />}
    </AnimatedTabs.List>
  )
}

/**
 * Base UI's own `Tabs.Indicator`, for a selection marker you style yourself:
 * an unstyled `<span>` that Base UI positions through `--active-tab-left` /
 * `-top` / `-width` / `-height`. Composing one turns animate-ui's automatic
 * indicator off, and the tabs paint their own selected state again.
 */
export function TabsIndicator(props: TabsIndicatorProps): ReactElement {
  return <AnimatedTabs.Indicator data-slot="tabs-indicator" {...props} />
}

// The vendored TabsTrigger's classes. It cannot be reused as is: animate-ui's
// indicator finds tabs by a marker its own Tab stamps.
const TAB_CLASSNAME = [
  `
    relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center
    gap-1.5 rounded-md border border-transparent px-1.5 py-0.5 text-sm
    font-medium whitespace-nowrap text-foreground/60 transition-all
    group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start
    hover:text-foreground
    focus-visible:border-ring focus-visible:ring-[3px]
    focus-visible:ring-ring/50 focus-visible:outline-1
    focus-visible:outline-ring
    disabled:pointer-events-none disabled:opacity-50
    has-data-[icon=inline-end]:pr-1 has-data-[icon=inline-start]:pl-1
    aria-disabled:pointer-events-none aria-disabled:opacity-50
    dark:text-muted-foreground dark:hover:text-foreground
    group-data-[variant=default]/tabs-list:data-active:shadow-sm
    group-data-[variant=line]/tabs-list:data-active:shadow-none
    [&_svg]:pointer-events-none [&_svg]:shrink-0
    [&_svg:not([class*='size-'])]:size-4
  `,
  `
    group-data-[variant=line]/tabs-list:bg-transparent
    group-data-[variant=line]/tabs-list:data-active:bg-transparent
    dark:group-data-[variant=line]/tabs-list:data-active:border-transparent
    dark:group-data-[variant=line]/tabs-list:data-active:bg-transparent
  `,
  `
    data-active:bg-background data-active:text-foreground
    dark:data-active:border-input dark:data-active:bg-input/30
    dark:data-active:text-foreground
  `,
  `
    after:absolute after:bg-foreground after:opacity-0 after:transition-opacity
    group-data-horizontal/tabs:after:inset-x-0
    group-data-horizontal/tabs:after:bottom-[-5px]
    group-data-horizontal/tabs:after:h-0.5
    group-data-vertical/tabs:after:inset-y-0
    group-data-vertical/tabs:after:-right-1
    group-data-vertical/tabs:after:w-0.5
    group-data-[variant=line]/tabs-list:data-active:after:opacity-100
  `,
]

/** Base UI's `Tabs.Tab`: `value` pairs it with a `TabsPanel`, plus `disabled`. */
export function TabsTab({ className, ...props }: TabsTabProps): ReactElement {
  return <AnimatedTabs.Tab data-slot="tabs-trigger" className={cn(...TAB_CLASSNAME, className)} {...props} />
}

const INSTANT = { duration: 0 }

/**
 * The panel. animate-ui fades it and shifts it toward the newly active tab;
 * `animated={false}` makes both instant.
 */
export function TabsPanel({ animated = true, className, ...props }: TabsPanelProps): ReactElement {
  return (
    <AnimatedTabs.Panel
      className={cn('flex-1 text-sm outline-none', className)}
      // Named for the part, not for the vendored file it came from: the
      // primitive writes `tabs-content` (shadcn's Radix-era word).
      data-slot="tabs-panel"
      {...(animated ? {} : { transition: INSTANT, exitTransition: INSTANT })}
      {...props}
    />
  )
}

export { tabsListVariants }
