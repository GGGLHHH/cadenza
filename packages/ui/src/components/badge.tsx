import type { VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'
import { Badge, badgeVariants } from '#primitives/badge'

/**
 * The published Badge — a small status pill, rendered through Base UI's
 * `useRender` so it can become an `<a>` (or anything) via `render`.
 *
 * ```tsx
 * <Badge variant="outline">Beta</Badge>
 * <Badge render={<a href="/changelog" />}>v0.7</Badge>
 * ```
 *
 * Six variants (`default | secondary | destructive | outline | ghost | link`),
 * mirrored as `data-variant`. An icon or `Spinner` inside the badge should
 * carry `data-icon="inline-start"` / `"inline-end"` — that is what pulls the
 * padding in on that side.
 *
 * `className` is honestly a string: the vendored part passes it into `cva`,
 * whose `cx` is clsx and drops a function silently (the same route, and the
 * same narrowing, as `Button`). The type already says so —
 * `useRender.ComponentProps<'span'>` is `ComponentPropsWithRef<'span'>` — so
 * this is a plain re-export; style off `data-variant` instead.
 */
export type BadgeProps = ComponentProps<typeof Badge>
/** The six looks. Mirrored as `data-variant`. */
export type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>

export { Badge, badgeVariants }
