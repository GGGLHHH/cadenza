import type { ComponentProps, ReactElement } from 'react'
import { ChevronRightIcon, EllipsisIcon } from '@gedatou/cadenza-icons'
import { cn } from '#lib/utils'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage } from '#primitives/breadcrumb'

/**
 * The published Breadcrumb family — shadcn's base-nova breadcrumb.
 *
 * ```tsx
 * <Breadcrumb>
 *   <BreadcrumbList>
 *     <BreadcrumbItem><BreadcrumbLink href="/">Home</BreadcrumbLink></BreadcrumbItem>
 *     <BreadcrumbSeparator />
 *     <BreadcrumbItem><BreadcrumbPage>Settings</BreadcrumbPage></BreadcrumbItem>
 *   </BreadcrumbList>
 * </Breadcrumb>
 * ```
 *
 * Five parts are re-exported as they are. `BreadcrumbSeparator` and
 * `BreadcrumbEllipsis` are forked only for their icon: the vendored ones draw
 * Tabler's, the published ones draw the animated set's (classes copied).
 * `BreadcrumbLink` takes `render` for a router link
 * (`render={<Link href="/" />}`); every other part is plain DOM, so
 * `className` is a plain string.
 */
export type BreadcrumbProps = ComponentProps<typeof Breadcrumb>
export type BreadcrumbListProps = ComponentProps<typeof BreadcrumbList>
export type BreadcrumbItemProps = ComponentProps<typeof BreadcrumbItem>
export type BreadcrumbLinkProps = ComponentProps<typeof BreadcrumbLink>
export type BreadcrumbPageProps = ComponentProps<typeof BreadcrumbPage>
export type BreadcrumbSeparatorProps = ComponentProps<'li'>
export type BreadcrumbEllipsisProps = ComponentProps<'span'>

/** A chevron between two items; children replace it. */
export function BreadcrumbSeparator({ children, className, ...props }: BreadcrumbSeparatorProps): ReactElement {
  return (
    <li
      aria-hidden="true"
      className={cn('[&>svg]:block-3.5 [&>svg]:inline-3.5', className)}
      data-slot="breadcrumb-separator"
      role="presentation"
      {...props}
    >
      {children ?? <ChevronRightIcon />}
    </li>
  )
}

/** Stands for collapsed items. */
export function BreadcrumbEllipsis({ className, ...props }: BreadcrumbEllipsisProps): ReactElement {
  return (
    <span
      aria-hidden="true"
      className={cn(`
        flex items-center justify-center block-5 inline-5
        [&>svg]:block-4 [&>svg]:inline-4
      `, className)}
      data-slot="breadcrumb-ellipsis"
      role="presentation"
      {...props}
    >
      <EllipsisIcon />
      <span className="sr-only">More</span>
    </span>
  )
}

export { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage }
