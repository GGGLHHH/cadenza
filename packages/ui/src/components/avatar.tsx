'use client'

import type { AvatarGroupProps as AnimatedAvatarGroupProps } from '@animate-ui/react/primitives/avatar-group'
import type { Avatar as AvatarPrimitive } from '@base-ui/react/avatar'
import type { ComponentProps, ReactElement, ReactNode } from 'react'
import {
  AvatarGroup as AnimatedAvatarGroup,
  AvatarGroupTooltip as AnimatedAvatarGroupTooltip,
  AvatarGroupTooltipArrow,
} from '@animate-ui/react/primitives/avatar-group'
import { motion } from 'motion/react'
import { cn } from '#lib/utils'
import { Avatar, AvatarBadge, AvatarFallback, AvatarGroupCount, AvatarImage } from '#primitives/avatar'

/**
 * The published Avatar family — Base UI's avatar in shadcn's base-nova skin.
 *
 * ```tsx
 * <Avatar>
 *   <AvatarImage src="/me.png" alt="" />
 *   <AvatarFallback>CN</AvatarFallback>
 * </Avatar>
 * ```
 *
 * The fallback shows until the image has loaded, and stays if it fails.
 * `size` (`'sm' | 'default' | 'lg'`) writes `data-size`, which the fallback
 * and `AvatarBadge` read too. Root, image and fallback are Base UI slots
 * (function `className` works); the badge is a plain `<span>`.
 */
export type AvatarProps = ComponentProps<typeof Avatar>
export type AvatarState = AvatarPrimitive.Root.State
export type AvatarImageProps = ComponentProps<typeof AvatarImage>
export type AvatarFallbackProps = ComponentProps<typeof AvatarFallback>
export type AvatarBadgeProps = ComponentProps<typeof AvatarBadge>
export type AvatarGroupProps = Omit<AnimatedAvatarGroupProps, 'children'> & {
  /**
   * Any nodes: animate-ui types this as elements only, but it runs them through
   * `Children.toArray`, which flattens arrays and drops empty values — so a
   * mapped list followed by an `AvatarGroupCount` is fine.
   */
  children?: ReactNode
}
export type AvatarGroupCountProps = ComponentProps<typeof AvatarGroupCount>
export type AvatarGroupTooltipProps = ComponentProps<typeof AnimatedAvatarGroupTooltip>

/**
 * A row of overlapping avatars — animate-ui's avatar group in the vendored
 * group's look. An avatar rises as the pointer meets it, and one tooltip
 * glides from avatar to avatar instead of each opening its own.
 *
 * ```tsx
 * <AvatarGroup>
 *   <Avatar>
 *     <AvatarImage src="/a.png" alt="" />
 *     <AvatarFallback>AL</AvatarFallback>
 *     <AvatarGroupTooltip>Alice</AvatarGroupTooltip>
 *   </Avatar>
 *   <AvatarGroupCount>+3</AvatarGroupCount>
 * </AvatarGroup>
 * ```
 *
 * Every child is wrapped in a container that carries the rise, which is why
 * the ring reaches the avatars through any depth (`**:`) rather than the
 * vendored group's direct-child selector. Later avatars sit on top;
 * `invertOverlap` puts the first one on top instead. The tooltip shows on hover
 * and on focus — an avatar that should be reachable from the keyboard needs a
 * `tabIndex` of its own.
 */
export function AvatarGroup({ children, className, ...props }: AvatarGroupProps): ReactElement {
  return (
    <AnimatedAvatarGroup
      className={cn(`
        group/avatar-group -space-x-2
        **:data-[slot=avatar]:ring-2 **:data-[slot=avatar]:ring-background
      `, className)}
      {...props}
    >
      {/* The narrower type is animate-ui's, not its runtime's (see the prop). */}
      {children as ReactElement[]}
    </AnimatedAvatarGroup>
  )
}

/**
 * The name shown above an avatar of an `AvatarGroup` — written inside the
 * avatar it belongs to. The library tooltip's look, arrow included; the text
 * keeps its proportions while the tooltip resizes from one name to the next.
 */
export function AvatarGroupTooltip({ children, className, ...props }: AvatarGroupTooltipProps): ReactElement {
  return (
    <AnimatedAvatarGroupTooltip
      className={cn(`
        rounded-md bg-foreground px-3 py-1.5 text-xs text-background
      `, className)}
      {...props}
    >
      {/* One element: animate-ui's content takes a single child. */}
      <>
        <AvatarGroupTooltipArrow className="
          fill-foreground block-2.5 inline-2.5
        "
        />
        <motion.span className="block whitespace-nowrap" layout="preserve-aspect">
          {children}
        </motion.span>
      </>
    </AnimatedAvatarGroupTooltip>
  )
}

export { Avatar, AvatarBadge, AvatarFallback, AvatarGroupCount, AvatarImage }
