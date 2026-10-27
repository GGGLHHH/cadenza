'use client'

import type { IconProps } from '@animate-ui/react/icons'
import type { Variants } from 'motion/react'
import type { ElementType, ReactElement } from 'react'
import { getVariants, IconPathStyle, IconWrapper, pathClassName, useAnimateIconContext } from '@animate-ui/react/icons'
import { motion } from 'motion/react'
import { createElement } from 'react'

type IconTag = 'circle' | 'ellipse' | 'g' | 'line' | 'path' | 'polygon' | 'polyline' | 'rect'

/**
 * How a shape moves: `null` never (a plain element); a variant key, driven by
 * the icon's state; `{ variants }`, its variants following the state its
 * parent group hands down; `{}`, a Motion element with no variants (for a
 * `style` only Motion reads, like `rotate`).
 */
export type IconNodeMotion = string | { readonly variants?: string } | null

/** One shape of an icon: its tag, its attributes, how it moves, and the shapes inside it for a group. */
export type IconNode = readonly [IconTag, Readonly<Record<string, unknown>>, IconNodeMotion, (readonly IconNode[])?]

/** An icon's named animations, each a variant set per animated shape. */
export interface IconAnimations {
  default: Record<string, Variants>
  [name: string]: Record<string, Variants>
}

export interface IconOptions {
  /**
   * How the `<svg>` itself takes part: a variant key animates it like a shape;
   * `true` only hands the animation state down to the shapes.
   */
  svg?: string | true
  /** The stroke-drawing stylesheet animate-ui's path animations rely on. */
  pathStyle?: boolean
}

// Element types, not each tag's own props: a shape's attributes come from data.
const MOTION: Record<IconTag, ElementType> = {
  circle: motion.circle,
  ellipse: motion.ellipse,
  g: motion.g,
  line: motion.line,
  path: motion.path,
  polygon: motion.polygon,
  polyline: motion.polyline,
  rect: motion.rect,
}

function renderNodes(
  nodes: readonly IconNode[],
  variants: Record<string, Variants>,
  controls: unknown,
): ReactElement[] {
  // An icon's shapes are a fixed list that never reorders: the index is the key.
  /* eslint-disable react/no-array-index-key */
  return nodes.map(([tag, attrs, mode, children], index) => {
    const inner = children ? renderNodes(children, variants, controls) : undefined
    if (mode === null)
      return createElement(tag, { key: index, ...attrs }, inner)
    const own = typeof mode === 'string'
      ? { variants: variants[mode], initial: 'initial', animate: controls }
      : mode.variants === undefined ? {} : { variants: variants[mode.variants] }
    return createElement(MOTION[tag], { key: index, ...attrs, ...own }, inner)
  })
  /* eslint-enable react/no-array-index-key */
}

/**
 * Builds an animated icon from its shapes and its animations. The `<svg>` is
 * a 24×24 stroke icon in lucide's style; triggers, loops and every other
 * animation prop come from animate-ui's `IconWrapper` and `AnimateIcon`.
 *
 * It is hidden from assistive tech unless it is named (`aria-label`,
 * `aria-labelledby`) or given a role — an icon beside text says nothing the
 * text does not, and an icon-only control names the control, not the icon.
 */
export function createIcon<A extends IconAnimations>(
  displayName: string,
  nodes: readonly IconNode[],
  animations: A,
  options: IconOptions = {},
): (props: IconProps<keyof A & string>) => ReactElement {
  function IconComponent({ size, className, ...props }: IconProps<keyof A & string>): ReactElement {
    const { controls } = useAnimateIconContext()
    const variants = getVariants(animations)
    const named = props['aria-label'] !== undefined || props['aria-labelledby'] !== undefined || props.role !== undefined
    const svgMotion = options.svg === undefined
      ? {}
      : { ...(options.svg === true ? {} : { variants: variants[options.svg] }), initial: 'initial', animate: controls }
    const svg = (
      <motion.svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden={named ? undefined : true}
        className={options.pathStyle ? [pathClassName, className].filter(Boolean).join(' ') : className}
        {...svgMotion}
        {...props}
      >
        {renderNodes(nodes, variants, controls)}
      </motion.svg>
    )
    return options.pathStyle
      ? (
          <>
            <IconPathStyle />
            {svg}
          </>
        )
      : svg
  }

  function Icon(props: IconProps<keyof A & string>): ReactElement {
    return <IconWrapper icon={IconComponent} {...props} />
  }
  Icon.displayName = displayName
  return Icon
}
