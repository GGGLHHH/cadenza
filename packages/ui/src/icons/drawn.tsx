'use client'

import type { IconProps } from '@animate-ui/react/icons'
import type { Icon as TablerIcon } from '@tabler/icons-react'
import type { ReactElement, SVGProps } from 'react'
import { IconPathStyle, IconWrapper, pathClassName, staticAnimations, useAnimateIconContext, useIconVariants } from '@animate-ui/react/icons'
import {
  IconAlignCenter,
  IconAlignLeft,
  IconAlignRight,
  IconBold,
  IconBrain,
  IconChevronsLeft,
  IconChevronsRight,
  IconColumns,
  IconFileMusic,
  IconGitBranch,
  IconGripVertical,
  IconHash,
  IconInbox,
  IconItalic,
  IconLayoutGrid,
  IconMoodSmile,
  IconPlayerStop,
  IconServer,
  IconTable,
  IconUnderline,
  IconUserPlus,
  IconVideo,
} from '@tabler/icons-react'
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
export const AlignCenter = /* @__PURE__ */ drawn(IconAlignCenter, 'AlignCenter')
export const AlignLeft = /* @__PURE__ */ drawn(IconAlignLeft, 'AlignLeft')
export const AlignRight = /* @__PURE__ */ drawn(IconAlignRight, 'AlignRight')
export const Bold = /* @__PURE__ */ drawn(IconBold, 'Bold')
export const Brain = /* @__PURE__ */ drawn(IconBrain, 'Brain')
export const ChevronsLeft = /* @__PURE__ */ drawn(IconChevronsLeft, 'ChevronsLeft')
export const ChevronsRight = /* @__PURE__ */ drawn(IconChevronsRight, 'ChevronsRight')
export const Columns = /* @__PURE__ */ drawn(IconColumns, 'Columns')
export const FileMusic = /* @__PURE__ */ drawn(IconFileMusic, 'FileMusic')
export const GitBranch = /* @__PURE__ */ drawn(IconGitBranch, 'GitBranch')
export const GripVertical = /* @__PURE__ */ drawn(IconGripVertical, 'GripVertical')
export const Hash = /* @__PURE__ */ drawn(IconHash, 'Hash')
export const Inbox = /* @__PURE__ */ drawn(IconInbox, 'Inbox')
export const Italic = /* @__PURE__ */ drawn(IconItalic, 'Italic')
export const LayoutGrid = /* @__PURE__ */ drawn(IconLayoutGrid, 'LayoutGrid')
export const Server = /* @__PURE__ */ drawn(IconServer, 'Server')
export const Smile = /* @__PURE__ */ drawn(IconMoodSmile, 'Smile')
export const Stop = /* @__PURE__ */ drawn(IconPlayerStop, 'Stop')
export const Table = /* @__PURE__ */ drawn(IconTable, 'Table')
export const Underline = /* @__PURE__ */ drawn(IconUnderline, 'Underline')
export const UserPlus = /* @__PURE__ */ drawn(IconUserPlus, 'UserPlus')
export const Video = /* @__PURE__ */ drawn(IconVideo, 'Video')

export {
  AlignCenter as AlignCenterIcon,
  AlignLeft as AlignLeftIcon,
  AlignRight as AlignRightIcon,
  Bold as BoldIcon,
  Brain as BrainIcon,
  ChevronsLeft as ChevronsLeftIcon,
  ChevronsRight as ChevronsRightIcon,
  Columns as ColumnsIcon,
  FileMusic as FileMusicIcon,
  GitBranch as GitBranchIcon,
  GripVertical as GripVerticalIcon,
  Hash as HashIcon,
  Inbox as InboxIcon,
  Italic as ItalicIcon,
  LayoutGrid as LayoutGridIcon,
  Server as ServerIcon,
  Smile as SmileIcon,
  Stop as StopIcon,
  Table as TableIcon,
  Underline as UnderlineIcon,
  UserPlus as UserPlusIcon,
  Video as VideoIcon,
}
