import type { Avatar as AvatarPrimitive } from '@base-ui/react/avatar'
import type { ComponentProps } from 'react'
import { Avatar, AvatarBadge, AvatarFallback, AvatarImage } from '#primitives/avatar'

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
 *
 * The vendored `AvatarGroup` / `AvatarGroupCount` are not published yet:
 * animate-ui has its own avatar group, and which one to adopt is still open.
 */
export type AvatarProps = ComponentProps<typeof Avatar>
export type AvatarState = AvatarPrimitive.Root.State
export type AvatarImageProps = ComponentProps<typeof AvatarImage>
export type AvatarFallbackProps = ComponentProps<typeof AvatarFallback>
export type AvatarBadgeProps = ComponentProps<typeof AvatarBadge>

export { Avatar, AvatarBadge, AvatarFallback, AvatarImage }
