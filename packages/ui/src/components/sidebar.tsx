'use client'

import type { VariantProps } from 'class-variance-authority'
import type { ComponentProps, CSSProperties, FocusEvent, PointerEvent, ReactElement, ReactNode } from 'react'
import type { TooltipPopupProps } from './tooltip'
import { Dialog as SheetPrimitive } from '@animate-ui/react/primitives/base-ui/dialog'
import * as SidebarPrimitive from '@animate-ui/react/primitives/sidebar'
import { motionTokens, useShouldReduceMotion, useTempoTransition } from '@animate-ui/react/utils/motion'
import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import { PanelLeftIcon } from '@gedatou/cadenza-icons'
import { cva } from 'class-variance-authority'
import { animate, AnimatePresence, motion } from 'motion/react'
import { createContext, use, useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { cn } from '#lib/utils'
import { Button } from '#primitives/button'
import {
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuItem,
  SidebarMenu as SidebarMenuPrimitive,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarSeparator,
} from '#primitives/sidebar'
import { Tooltip, TooltipPopup, TooltipTrigger } from './tooltip'

/**
 * The published Sidebar family — shadcn's base-nova sidebar on animate-ui's
 * sidebar primitive (`@animate-ui/react/primitives/sidebar`), assembled the
 * way animate-ui's own Base UI sidebar is.
 *
 * What the primitive brings: collapsing to icons and back runs on one curve (the
 * labels blur out first, the parts the collapse hides fold instead of
 * vanishing, the gap in the page follows the panel's edge frame by frame);
 * ⌘B skips text fields; `isMobile` reads the viewport without a flash. The
 * mobile drawer is animate-ui's Dialog sliding in from its side, the
 * collapsed tooltips are the library's (animate-ui's) Tooltip, and the
 * trigger's panel icon narrows while the sidebar is closed.
 *
 * The highlight is the seam's own, not the primitive's: one surface that IS
 * the active item's background. At rest it sits on the `isActive` button;
 * hovering (or keyboard-focusing) another button glides it there, and leaving
 * glides it back. The primitive's highlight paints the hovered button beside
 * the active one's own background — two surfaces in one color, telling apart
 * neither — and an `isActive` button cannot join its lit set without a false
 * `aria-expanded`. So the primitive's is off and `MenuHighlightScope` below
 * runs this one, on animate-ui's highlight spring and color fade.
 *
 * Why these parts are rebuilt rather than re-exported: the primitive keeps the
 * state in its own context, and every vendored part that reads the sidebar
 * (`Sidebar`, `SidebarTrigger`, `SidebarRail`, `SidebarMenuButton`) calls the
 * vendored `useSidebar`, which would find no provider and throw;
 * `SidebarMenuSubButton` is rebuilt to join the highlight. Their classes
 * are copied from primitives/sidebar.tsx — minus the gap's and container's
 * CSS transitions, which the primitive times itself — and their behaviour is
 * the vendored one. The other parts only carry `data-sidebar` hooks the
 * primitive already reads, so they stay the vendored components. The cost,
 * owned here: the rebuilt parts no longer follow upstream drift.
 *
 * Still shadcn's, as-is: the `isActive` / `showOnHover` / `showIcon` props
 * (not bare adjectives), the English sr-only text, `useSidebar`'s unbranded
 * error, `SidebarRail`'s `onClick` replacing the toggle rather than chaining.
 *
 * Behaviour that lives in `SidebarProvider`, worth knowing before mounting it:
 *
 * - **Viewport, not container.** The desktop panel is `position: fixed` and
 *   `h-svh`; below 768px Sidebar renders as a sheet instead.
 * - **⌘B / Ctrl+B** toggles it — a `window` keydown listener, one per
 *   provider, ignored while focus is in a text field.
 * - **A cookie.** Every open change writes `sidebar_state` (path `/`, 7 days);
 *   reading it back (for SSR's `defaultOpen`) is the app's job.
 */
export const useSidebar = SidebarPrimitive.useSidebar
/** What `useSidebar()` returns. */
export type SidebarContextValue = SidebarPrimitive.SidebarContextProps

const SIDEBAR_WIDTH = '16rem'
const SIDEBAR_WIDTH_MOBILE = '18rem'
const SIDEBAR_WIDTH_ICON = '3rem'

const AnimateOnHoverContext = createContext(true)

interface MenuHighlight {
  /** Where the surface sits: the hovered button, else the keyboard-focused one, else the active one. */
  target: string | null
  /** Where it sat before: a button lit next glides in from there rather than fading in. */
  previous: string | null
  /**
   * Lit from nothing after having been lit before (the pointer back on a menu
   * with no active button): fade in. The first lighting — the active button,
   * registered just after mount — shows at once.
   */
  fadesIn: boolean
  /**
   * Makes `element` the lit surface and returns where the one before it is on
   * screen right now — mid-glide included — for the new one to glide from.
   */
  takeOver: (element: HTMLElement) => DOMRect | null
  hover: (id: string | null) => void
  focus: (id: string | null) => void
  /** Marks a button active until the returned cleanup runs. */
  activate: (id: string) => () => void
}

const MenuHighlightContext = createContext<MenuHighlight | null>(null)
if (process.env.NODE_ENV !== 'production')
  MenuHighlightContext.displayName = 'SidebarMenuHighlightContext'

// Crossing the gap between two buttons leaves one a few ms before entering
// the next; clearing the hover at once would send the surface home to the
// active button and back. ponytail: a fixed delay, not pointer tracking.
const LEAVE_DELAY = 100

/** One highlight for every menu and sub-menu button inside it (one panel's worth). */
function MenuHighlightScope({ children }: { children: ReactNode }): ReactElement {
  const [hovered, setHovered] = useState<string | null>(null)
  const [focused, setFocused] = useState<string | null>(null)
  const [active, setActive] = useState<string[]>([])
  const target = hovered ?? focused ?? active.at(-1) ?? null
  const [moves, setMoves] = useState({ target, previous: null as string | null, lit: target !== null })
  if (moves.target !== target)
    setMoves({ target, previous: moves.target, lit: moves.lit || moves.target !== null })
  const surfaceRef = useRef<HTMLElement | null>(null)
  const takeOver = useCallback((element: HTMLElement) => {
    const previous = surfaceRef.current
    surfaceRef.current = element
    // Faded out (the pointer left a menu with no active button): nothing to glide from.
    if (!previous?.isConnected || previous === element || Number(getComputedStyle(previous).opacity) < 0.01)
      return null
    return previous.getBoundingClientRect()
  }, [])
  const leaveTimerRef = useRef(0)
  const hover = useCallback((id: string | null) => {
    window.clearTimeout(leaveTimerRef.current)
    if (id !== null)
      setHovered(id)
    else
      leaveTimerRef.current = window.setTimeout(setHovered, LEAVE_DELAY, null)
  }, [])
  useEffect(() => () => window.clearTimeout(leaveTimerRef.current), [])
  const activate = useCallback((id: string) => {
    setActive(list => [...list, id])
    return () => setActive(list => list.filter(other => other !== id))
  }, [])
  const value = useMemo(
    () => ({ target, previous: moves.previous, fadesIn: moves.previous === null && moves.lit, takeOver, hover, focus: setFocused, activate }),
    [target, moves.previous, moves.lit, takeOver, hover, activate],
  )
  return <MenuHighlightContext value={value}>{children}</MenuHighlightContext>
}

const MENU_BUTTONS = '[data-sidebar=menu-button],[data-sidebar=menu-sub-button]'
const INERT = ':disabled,[aria-disabled=true],[data-disabled]'

// The button's own backgrounds give way to the surface beside it; `relative`
// paints the button (its icon and text) above that surface.
const HIGHLIGHTED_BUTTON_CLASSNAME = 'relative hover:bg-transparent active:bg-transparent data-active:bg-transparent data-open:hover:bg-transparent'

interface Box { top: number, left: number, width: number, height: number }

const sameBox = (a: Box | null, b: Box): boolean => a !== null && a.top === b.top && a.left === b.left && a.width === b.width && a.height === b.height

/**
 * A button's part in the highlight: what it merges onto itself, and the
 * surface it renders beside itself (in its menu item, over its box — inside,
 * the button's `overflow-hidden` would cut the surface as it glides in).
 * `null` outside a scope, or for a button that keeps its own background.
 */
interface MenuHighlightItem {
  ref: (node: Element | null) => void
  className: string
  props: {
    onPointerEnter: (event: PointerEvent<HTMLElement>) => void
    onPointerLeave: () => void
    onFocus: (event: FocusEvent<HTMLElement>) => void
    onBlur: (event: FocusEvent<HTMLElement>) => void
  }
  surface: ReactElement
}

function useMenuHighlight(isActive: boolean, joins: boolean): MenuHighlightItem | null {
  const scope = use(MenuHighlightContext)
  const on = scope !== null && joins
  const id = useId()
  const [node, setNode] = useState<Element | null>(null)
  const [box, setBox] = useState<Box | null>(null)
  const activate = scope?.activate

  useLayoutEffect(() => (on && isActive && activate ? activate(id) : undefined), [on, isActive, activate, id])

  // Measured all along, not when lit: the surface must mount on the right box
  // for Motion to glide it from the previous one. It follows the button
  // through the collapse to icons.
  useLayoutEffect(() => {
    if (!on || !(node instanceof HTMLElement))
      return
    const place = (): void => {
      const next = { top: node.offsetTop, left: node.offsetLeft, width: node.offsetWidth, height: node.offsetHeight }
      // A measurement of the laid-out DOM, taken before paint.
      // eslint-disable-next-line react/set-state-in-effect
      setBox(current => sameBox(current, next) ? current : next)
    }
    place()
    const observer = new ResizeObserver(place)
    observer.observe(node)
    return () => observer.disconnect()
  }, [on, node])

  if (!on)
    return null
  return {
    ref: setNode,
    className: HIGHLIGHTED_BUTTON_CLASSNAME,
    props: {
      onPointerEnter: (event: PointerEvent<HTMLElement>) => {
        if (event.pointerType !== 'touch' && !event.currentTarget.matches(INERT))
          scope.hover(id)
      },
      onPointerLeave: () => scope.hover(null),
      // Keyboard focus only: a click focuses too, and must not pin the surface.
      onFocus: (event: FocusEvent<HTMLElement>) => scope.focus(event.currentTarget.matches(':focus-visible') ? id : null),
      onBlur: (event: FocusEvent<HTMLElement>) => {
        // Moving on to another button: its focus takes over, no detour home.
        if (!(event.relatedTarget instanceof Element && event.relatedTarget.matches(MENU_BUTTONS)))
          scope.focus(null)
      },
    },
    surface: <MenuHighlightSurface box={box} id={id} scope={scope} />,
  }
}

function MenuHighlightSurface({ id, scope, box }: { id: string, scope: MenuHighlight, box: Box | null }): ReactElement {
  const handingOff = scope.target !== null
  return (
    <AnimatePresence custom={handingOff} initial={false}>
      {/* Mounted before its box is measured, so the first paint (the active
          button at mount) does not fade in: the layout effect fills the box
          in before paint. */}
      {scope.target === id && <GlidingSurface box={box} fadesIn={scope.fadesIn} key="surface" takeOver={scope.takeOver} />}
    </AnimatePresence>
  )
}

/**
 * The surface itself. It glides by transform from where the previous surface
 * is on screen — read at mount, so a glide cut short starts the next from
 * where it got to — to its own box: the way animate-ui's own highlight moves.
 * Not Motion's `layoutId`: that glides from the layout it last measured, which
 * goes stale whenever the box changes without the target changing (the first
 * box filled in after mount, every collapse to icons), and the next glide
 * then starts with a jump.
 */
function GlidingSurface({ box, fadesIn, takeOver }: { box: Box | null, fadesIn: boolean, takeOver: MenuHighlight['takeOver'] }): ReactElement {
  const reduce = useShouldReduceMotion()
  const glide = useTempoTransition(motionTokens.spring.highlight)
  const fade = useTempoTransition(motionTokens.transition.color)
  const ref = useRef<HTMLSpanElement>(null)
  // Where the surface before was, read once: Strict Mode runs this effect
  // twice, and the second run must glide from the same place.
  const takenRef = useRef<{ from: DOMRect | null } | null>(null)

  useLayoutEffect(() => {
    const element = ref.current
    if (!element)
      return
    takenRef.current ??= { from: takeOver(element) }
    const { from } = takenRef.current
    // Its own box without a glide still on it (a first run stopped midway).
    element.style.transform = 'none'
    const to = element.getBoundingClientRect()
    if (!from || reduce || to.width === 0 || to.height === 0)
      return
    const controls = animate(element, {
      x: [from.left - to.left, 0],
      y: [from.top - to.top, 0],
      scaleX: [from.width / to.width, 1],
      scaleY: [from.height / to.height, 1],
    }, glide)
    return () => controls.stop()
    // Once, at mount: a surface glides in only when it takes over.
    // eslint-disable-next-line react/exhaustive-deps
  }, [])

  return (
    <motion.span
      animate="shown"
      aria-hidden
      // Under every label: a surface gliding down from an earlier item comes
      // later in the DOM and would paint over the labels it crosses. The
      // panel's background element is `isolate`, so -z-1 stays above it.
      className="
        pointer-events-none absolute -z-1 origin-top-left rounded-md
        bg-sidebar-accent
      "
      data-slot="sidebar-menu-highlight"
      exit="hidden"
      // Handed over from another button, it glides (no entrance of its own);
      // lit from nothing, it fades in.
      initial={fadesIn ? 'hidden' : false}
      ref={ref}
      style={box ?? undefined}
      variants={{
        // Handing off, the old surface goes at once: the new one is it, moved.
        hidden: (handing: boolean) => ({ opacity: 0, transition: handing ? { duration: 0 } : fade }),
        shown: { opacity: 1, transition: fade },
      }}
    />
  )
}

export type SidebarProviderProps = ComponentProps<typeof SidebarPrimitive.Provider>

/**
 * Holds the open state (the desktop panel's and the mobile sheet's, apart).
 * `animateOnHover={false}` drops the gliding highlight and keeps the buttons'
 * own hover and active backgrounds.
 */
export function SidebarProvider({ animateOnHover = true, className, style, ...props }: SidebarProviderProps): ReactElement {
  return (
    <AnimateOnHoverContext value={animateOnHover}>
      <SidebarPrimitive.Provider
        animateOnHover={false}
        className={cn(`
          group/sidebar-wrapper flex inline-full min-block-svh
          has-data-[variant=inset]:bg-sidebar
        `, className)}
        data-slot="sidebar-wrapper"
        style={{ '--sidebar-width': SIDEBAR_WIDTH, '--sidebar-width-icon': SIDEBAR_WIDTH_ICON, ...style } as CSSProperties}
        {...props}
      />
    </AnimateOnHoverContext>
  )
}

export type SidebarProps = ComponentProps<'div'> & {
  side?: 'left' | 'right'
  variant?: 'sidebar' | 'floating' | 'inset'
  collapsible?: 'offcanvas' | 'icon' | 'none'
}

// The vendored SheetContent's classes for a left / right sheet, minus its CSS
// slide and fade — animate-ui's Dialog slides the popup in from `data-side` —
// plus the sidebar's own size and colors.
const SHEET_CLASSNAME = 'fixed z-50 flex flex-col gap-4 bg-clip-padding text-sm shadow-lg data-[side=left]:inset-y-0 data-[side=left]:left-0 data-[side=left]:h-full data-[side=left]:border-r data-[side=right]:inset-y-0 data-[side=right]:right-0 data-[side=right]:h-full data-[side=right]:border-l w-(--sidebar-width) bg-sidebar p-0 text-sidebar-foreground'
const SHEET_BACKDROP_CLASSNAME = 'fixed inset-0 z-50 bg-black/10 supports-backdrop-filter:backdrop-blur-xs'

const GAP_CLASSNAME = 'relative w-(--sidebar-width) bg-transparent group-data-[collapsible=offcanvas]:w-0 group-data-[side=right]:rotate-180'
const CONTAINER_CLASSNAME = 'fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) data-[side=left]:left-0 data-[side=left]:group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)] data-[side=right]:right-0 data-[side=right]:group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)] md:flex'
const INNER_CLASSNAME = 'isolate flex size-full flex-col bg-sidebar group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:shadow-sm group-data-[variant=floating]:ring-1 group-data-[variant=floating]:ring-sidebar-border'

/**
 * The panel. Three forms, as the vendored one: `collapsible="none"` is a plain
 * column, below 768px a sheet, otherwise the fixed desktop panel. `className`
 * and the rest of the props land on the column, or on the desktop panel's
 * container; the sheet takes neither.
 */
export function Sidebar({
  side = 'left',
  variant = 'sidebar',
  collapsible = 'offcanvas',
  className,
  children,
  dir,
  ...props
}: SidebarProps): ReactElement {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar()
  const inset = variant === 'floating' || variant === 'inset'
  const content = use(AnimateOnHoverContext) ? <MenuHighlightScope>{children}</MenuHighlightScope> : children

  if (collapsible === 'none') {
    return (
      <SidebarPrimitive.Highlight
        className={cn(`
          isolate flex flex-col bg-sidebar text-sidebar-foreground block-full
          inline-(--sidebar-width)
        `, className)}
        data-slot="sidebar"
        {...props}
      >
        {content}
      </SidebarPrimitive.Highlight>
    )
  }

  if (isMobile) {
    return (
      <SheetPrimitive.Root onOpenChange={setOpenMobile} open={openMobile}>
        <SheetPrimitive.Portal>
          <SheetPrimitive.Backdrop className={SHEET_BACKDROP_CLASSNAME} data-slot="sheet-overlay" />
          <SheetPrimitive.Popup
            className={SHEET_CLASSNAME}
            data-mobile="true"
            data-side={side}
            data-sidebar="sidebar"
            data-slot="sidebar"
            dir={dir}
            style={{ '--sidebar-width': SIDEBAR_WIDTH_MOBILE } as CSSProperties}
          >
            <div className="sr-only">
              <SheetPrimitive.Title>Sidebar</SheetPrimitive.Title>
              <SheetPrimitive.Description>Displays the mobile sidebar.</SheetPrimitive.Description>
            </div>
            <SidebarPrimitive.Highlight className="
              isolate flex flex-col block-full inline-full
            "
            >
              {content}
            </SidebarPrimitive.Highlight>
          </SheetPrimitive.Popup>
        </SheetPrimitive.Portal>
      </SheetPrimitive.Root>
    )
  }

  return (
    <div
      className="
        group peer hidden text-sidebar-foreground
        md:block
      "
      data-collapsible={state === 'collapsed' ? collapsible : ''}
      data-side={side}
      data-slot="sidebar"
      data-state={state}
      data-variant={variant}
    >
      <SidebarPrimitive.Gap
        className={cn(
          GAP_CLASSNAME,
          inset
            ? `
              group-data-[collapsible=icon]:inline-[calc(var(--sidebar-width-icon)+(--spacing(4)))]
            `
            : 'group-data-[collapsible=icon]:inline-(--sidebar-width-icon)',
        )}
        data-slot="sidebar-gap"
      />
      <SidebarPrimitive.Container
        className={cn(
          CONTAINER_CLASSNAME,
          inset
            ? `
              p-2
              group-data-[collapsible=icon]:inline-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]
            `
            : `
              group-data-[collapsible=icon]:inline-(--sidebar-width-icon)
              group-data-[side=left]:border-e
              group-data-[side=right]:border-s
            `,
          className,
        )}
        data-side={side}
        data-slot="sidebar-container"
        {...props}
      >
        <SidebarPrimitive.Highlight className={INNER_CLASSNAME} data-sidebar="sidebar" data-slot="sidebar-inner">
          {content}
        </SidebarPrimitive.Highlight>
      </SidebarPrimitive.Container>
    </div>
  )
}

export type SidebarTriggerProps = ComponentProps<typeof Button>

/**
 * Toggles the panel (the sheet, below 768px). Runs a passed `onClick` first.
 * Its panel icon narrows while the sidebar is closed; `children` is ignored,
 * as in the vendored trigger.
 */
export function SidebarTrigger({ className, onClick, ...props }: SidebarTriggerProps): ReactElement {
  const { toggleSidebar, open, openMobile, isMobile } = useSidebar()

  return (
    <Button
      className={cn(className)}
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      onClick={(event) => {
        onClick?.(event)
        toggleSidebar()
      }}
      size="icon-sm"
      variant="ghost"
      {...props}
    >
      {/* `initial={false}`: a sidebar that starts closed shows the narrowed panel at once. */}
      <PanelLeftIcon animate={!(isMobile ? openMobile : open)} initial={false} />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  )
}

export type SidebarRailProps = ComponentProps<'button'>

const RAIL_CLASSNAME = 'absolute inset-y-0 z-20 hidden w-4 transition-all ease-linear group-data-[side=left]:-right-4 group-data-[side=right]:left-0 after:absolute after:inset-y-0 after:start-1/2 after:w-[2px] hover:after:bg-sidebar-border sm:flex ltr:-translate-x-1/2 rtl:-translate-x-1/2 in-data-[side=left]:cursor-w-resize in-data-[side=right]:cursor-e-resize [[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full hover:group-data-[collapsible=offcanvas]:bg-sidebar [[data-side=left][data-collapsible=offcanvas]_&]:-right-2 [[data-side=right][data-collapsible=offcanvas]_&]:-left-2'

/** The strip along the panel's edge that toggles it; out of the Tab order. */
export function SidebarRail({ className, ...props }: SidebarRailProps): ReactElement {
  const { toggleSidebar } = useSidebar()

  return (
    <button
      aria-label="Toggle Sidebar"
      className={cn(RAIL_CLASSNAME, className)}
      data-sidebar="rail"
      data-slot="sidebar-rail"
      onClick={toggleSidebar}
      tabIndex={-1}
      title="Toggle Sidebar"
      type="button"
      {...props}
    />
  )
}

const sidebarMenuButtonVariants = cva(
  `
    peer/menu-button group/menu-button flex items-center gap-2 overflow-hidden
    rounded-md p-2 text-start text-sm ring-sidebar-ring outline-hidden
    transition-[width,height,padding] inline-full
    group-has-data-[sidebar=menu-action]/menu-item:pe-8
    group-data-[collapsible=icon]:p-2! group-data-[collapsible=icon]:block-8!
    group-data-[collapsible=icon]:inline-8!
    hover:bg-sidebar-accent hover:text-sidebar-accent-foreground
    focus-visible:ring-2
    active:bg-sidebar-accent active:text-sidebar-accent-foreground
    disabled:pointer-events-none disabled:opacity-50
    aria-disabled:pointer-events-none aria-disabled:opacity-50
    data-open:hover:bg-sidebar-accent
    data-open:hover:text-sidebar-accent-foreground
    data-active:bg-sidebar-accent data-active:font-medium
    data-active:text-sidebar-accent-foreground
    [&_svg]:shrink-0 [&_svg]:block-4 [&_svg]:inline-4
    [&>span:last-child]:truncate
  `,
  {
    variants: {
      variant: {
        default: 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        outline: `
          bg-background shadow-[0_0_0_1px_var(--sidebar-border)]
          hover:bg-sidebar-accent hover:text-sidebar-accent-foreground
          hover:shadow-[0_0_0_1px_var(--sidebar-accent)]
        `,
      },
      size: {
        default: 'text-sm block-8',
        sm: 'text-xs block-7',
        lg: `
          text-sm block-12
          group-data-[collapsible=icon]:p-0!
        `,
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export type SidebarMenuButtonProps = useRender.ComponentProps<'button'>
  & ComponentProps<'button'>
  & VariantProps<typeof sidebarMenuButtonVariants>
  & {
    isActive?: boolean
    /**
     * Shown beside the button while the panel is collapsed to icons. The object
     * form takes the popup's props; its `hidden` overrides when it shows
     * (`hidden: false` shows it expanded too).
     */
    tooltip?: string | TooltipPopupProps
  }

/**
 * A menu item's button. With `tooltip`, collapsed to icons, hovering it shows
 * the tooltip to its right; expanded or on mobile, the tooltip is disabled.
 */
export function SidebarMenuButton({
  render,
  isActive = false,
  variant = 'default',
  size = 'default',
  tooltip,
  className,
  ...props
}: SidebarMenuButtonProps): ReactElement {
  const { isMobile, state } = useSidebar()
  // The vendored truthiness check: an empty string is no tooltip.
  const hasTooltip = tooltip !== undefined && tooltip !== ''
  // An outline button paints its own `bg-background`, which would hide the surface behind it.
  const highlight = useMenuHighlight(isActive, variant !== 'outline')
  const button = useRender({
    defaultTagName: 'button',
    props: mergeProps<'button'>(
      { className: cn(sidebarMenuButtonVariants({ variant, size }), highlight?.className, className) },
      highlight?.props ?? {},
      props,
    ),
    ref: highlight?.ref,
    render: hasTooltip ? <TooltipTrigger render={render} /> : render,
    state: { slot: 'sidebar-menu-button', sidebar: 'menu-button', size, active: isActive },
  })

  // The vendored popup takes `hidden={collapsed? …}` before the object's own
  // props, so `tooltip={{ children, hidden: false }}` shows it expanded too.
  const { hidden, ...popup } = typeof tooltip === 'object' ? tooltip : { children: tooltip }
  const element = hasTooltip
    ? (
        // `disabled` rather than the vendored `hidden` on the popup: animate-ui's
        // popup would still play its entrance, just unseen.
        <Tooltip disabled={hidden ?? (state !== 'collapsed' || isMobile)}>
          {button}
          <TooltipPopup align="center" side="right" {...popup} />
        </Tooltip>
      )
    : button

  return highlight
    ? (
        <>
          {highlight.surface}
          {element}
        </>
      )
    : element
}

const SUB_BUTTON_CLASSNAME = 'flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 text-sidebar-foreground ring-sidebar-ring outline-hidden group-data-[collapsible=icon]:hidden hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[size=md]:text-sm data-[size=sm]:text-xs data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-sidebar-accent-foreground'

export type SidebarMenuSubButtonProps = useRender.ComponentProps<'a'>
  & ComponentProps<'a'>
  & {
    size?: 'sm' | 'md'
    isActive?: boolean
  }

/** A sub-menu item's link (an `<a>` by default); shares the menu's highlight. */
export function SidebarMenuSubButton({
  render,
  size = 'md',
  isActive = false,
  className,
  ...props
}: SidebarMenuSubButtonProps): ReactElement {
  const highlight = useMenuHighlight(isActive, true)
  const link = useRender({
    defaultTagName: 'a',
    props: mergeProps<'a'>({ className: cn(SUB_BUTTON_CLASSNAME, highlight?.className, className) }, highlight?.props ?? {}, props),
    ref: highlight?.ref,
    render,
    state: { slot: 'sidebar-menu-sub-button', sidebar: 'menu-sub-button', size, active: isActive },
  })

  return highlight
    ? (
        <>
          {highlight.surface}
          {link}
        </>
      )
    : link
}

export type SidebarMenuProps = ComponentProps<typeof SidebarMenuPrimitive>

/**
 * A menu: a `<ul>` of `SidebarMenuItem`s, 4px apart — the gap shadcn's
 * new-york uses; base-nova packs them at `gap-0`, where a lit row runs into
 * the next. A caller's `gap-*` still wins.
 */
export function SidebarMenu({ className, ...props }: SidebarMenuProps): ReactElement {
  return <SidebarMenuPrimitive className={cn('gap-1', className)} {...props} />
}

export type SidebarContentProps = ComponentProps<typeof SidebarContent>
export type SidebarFooterProps = ComponentProps<typeof SidebarFooter>
export type SidebarGroupProps = ComponentProps<typeof SidebarGroup>
export type SidebarGroupActionProps = ComponentProps<typeof SidebarGroupAction>
export type SidebarGroupContentProps = ComponentProps<typeof SidebarGroupContent>
export type SidebarGroupLabelProps = ComponentProps<typeof SidebarGroupLabel>
export type SidebarHeaderProps = ComponentProps<typeof SidebarHeader>
export type SidebarInputProps = ComponentProps<typeof SidebarInput>
export type SidebarInsetProps = ComponentProps<typeof SidebarInset>
export type SidebarMenuActionProps = ComponentProps<typeof SidebarMenuAction>
export type SidebarMenuBadgeProps = ComponentProps<typeof SidebarMenuBadge>
export type SidebarMenuItemProps = ComponentProps<typeof SidebarMenuItem>
export type SidebarMenuSkeletonProps = ComponentProps<typeof SidebarMenuSkeleton>
export type SidebarMenuSubProps = ComponentProps<typeof SidebarMenuSub>
export type SidebarMenuSubItemProps = ComponentProps<typeof SidebarMenuSubItem>
export type SidebarSeparatorProps = ComponentProps<typeof SidebarSeparator>

export {
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarSeparator,
}
