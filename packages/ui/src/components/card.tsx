import type { ComponentProps } from 'react'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '#primitives/card'

/**
 * The published Card family — shadcn's base-nova card, re-exported as is.
 *
 * ```tsx
 * <Card>
 *   <CardHeader>
 *     <CardTitle>Title</CardTitle>
 *     <CardDescription>Description</CardDescription>
 *     <CardAction>…</CardAction>
 *   </CardHeader>
 *   <CardContent>…</CardContent>
 *   <CardFooter>…</CardFooter>
 * </Card>
 * ```
 *
 * `size="sm"` tightens the spacing (it sets `--card-spacing`, which every
 * part pads with). All parts are plain `<div>`s with no Base UI state, so
 * `className` is a plain string.
 */
export type CardProps = ComponentProps<typeof Card>
export type CardHeaderProps = ComponentProps<typeof CardHeader>
export type CardTitleProps = ComponentProps<typeof CardTitle>
export type CardDescriptionProps = ComponentProps<typeof CardDescription>
export type CardActionProps = ComponentProps<typeof CardAction>
export type CardContentProps = ComponentProps<typeof CardContent>
export type CardFooterProps = ComponentProps<typeof CardFooter>

export { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle }
