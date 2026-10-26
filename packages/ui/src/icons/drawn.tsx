'use client'

import type { IconProps } from '@animate-ui/react/icons'
import type { Icon as TablerIcon } from '@tabler/icons-react'
import type { ReactElement, SVGProps } from 'react'
import { IconPathStyle, IconWrapper, pathClassName, staticAnimations, useAnimateIconContext, useIconVariants } from '@animate-ui/react/icons'
import { IconBrain, IconChevronsLeft, IconChevronsRight, IconGripVertical, IconPlayerStop, IconServer } from '@tabler/icons-react'
import { motion } from 'motion/react'
import { Children, createElement, isValidElement, useMemo } from 'react'

type Rendered = ReactElement<SVGProps<SVGSVGElement> & { children?: unknown }>
type Shape = ReactElement<Record<string, unknown>>
type MotionTag = typeof motion.path

/**
 * Animated icons for the shapes animate-ui's set does not draw, made from
 * Tabler's (MIT): the icon's own shapes become Motion elements driven by
 * AnimateIcon's controls — how animate-ui builds its icons — and their one
 * animation is animate-ui's generic stroke draw (`staticAnimations.path`), so
 * they take every trigger and prop the pulled icons do.
 *
 * A Tabler icon is a forwardRef component; calling its render gives the
 * `<svg>` and its shapes without mounting anything.
 */
function drawn(icon: TablerIcon, name: string): (props: IconProps<'default'>) => ReactElement {
  function IconComponent({ size, className, ...props }: IconProps<'default'>): ReactElement {
    const svg = (icon as unknown as { render: (props: object, ref: null) => Rendered }).render({ size }, null)
    const shapes = Children.toArray(svg.props.children).filter(isValidElement) as Shape[]
    const count = shapes.length
    const animations = useMemo(
      () => ({ default: Object.fromEntries(Array.from({ length: count }, (_, i) => [`shape${i}`, staticAnimations.path])) }),
      [count],
    )
    const variants = useIconVariants(animations)
    const { controls } = useAnimateIconContext()
    const { children: _, className: tablerClassName, ...rootProps } = svg.props
    return (
      <>
        <IconPathStyle />
        <motion.svg
          {...(rootProps as object)}
          className={[tablerClassName, pathClassName, className].filter(Boolean).join(' ')}
          {...(props)}
        >
          {shapes.map((shape, i) => createElement(
            (motion as unknown as Record<string, MotionTag>)[shape.type as string] ?? motion.path,
            // Tabler keys its shapes itself (`svg-0`, `svg-1`, …).
            { ...shape.props, key: shape.key, variants: variants[`shape${i}`], initial: 'initial', animate: controls },
          ))}
        </motion.svg>
      </>
    )
  }
  function Drawn(props: IconProps<'default'>): ReactElement {
    return <IconWrapper icon={IconComponent} {...props} />
  }
  Drawn.displayName = name
  return Drawn
}

// Pure: a bundler may drop any icon nothing imports.
export const Brain = /* @__PURE__ */ drawn(IconBrain, 'Brain')
export const ChevronsLeft = /* @__PURE__ */ drawn(IconChevronsLeft, 'ChevronsLeft')
export const ChevronsRight = /* @__PURE__ */ drawn(IconChevronsRight, 'ChevronsRight')
export const GripVertical = /* @__PURE__ */ drawn(IconGripVertical, 'GripVertical')
export const Server = /* @__PURE__ */ drawn(IconServer, 'Server')
export const Stop = /* @__PURE__ */ drawn(IconPlayerStop, 'Stop')

export {
  Brain as BrainIcon,
  ChevronsLeft as ChevronsLeftIcon,
  ChevronsRight as ChevronsRightIcon,
  GripVertical as GripVerticalIcon,
  Server as ServerIcon,
  Stop as StopIcon,
}
