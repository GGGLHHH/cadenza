'use client'

import type { ComponentType, ReactElement } from 'react'
import { lazy, Suspense } from 'react'

// 客户端 demo registry:lazy 让每个 demo 独立分包,页面只拉用到的
const registry: Record<string, ComponentType> = {
  'data-pagination/basic': lazy(() => import('./data-pagination/basic')),
  'data-pagination/controlled': lazy(() => import('./data-pagination/controlled')),
  'data-pagination/labels': lazy(() => import('./data-pagination/labels')),
  'data-table/basic': lazy(() => import('./data-table/basic')),
  'data-table/sort': lazy(() => import('./data-table/sort')),
  'data-table/selection-single': lazy(() => import('./data-table/selection-single')),
  'data-table/selection-multiple': lazy(() => import('./data-table/selection-multiple')),
  'data-table/selection-archive': lazy(() => import('./data-table/selection-archive')),
  'data-table/hscroll': lazy(() => import('./data-table/hscroll')),
  'data-table/pinned': lazy(() => import('./data-table/pinned')),
  'data-table/pagination': lazy(() => import('./data-table/pagination')),
  'data-table/infinite': lazy(() => import('./data-table/infinite')),
  'data-table/slot-empty': lazy(() => import('./data-table/slot-empty')),
  'data-table/slot-loading': lazy(() => import('./data-table/slot-loading')),
  'data-table/slot-error': lazy(() => import('./data-table/slot-error')),
  'data-table/virtualized': lazy(() => import('./data-table/virtualized')),
  'data-table/dynamic-row-height': lazy(() => import('./data-table/dynamic-row-height')),
  'infinite-select/single': lazy(() => import('./infinite-select/single')),
  'infinite-select/multiple': lazy(() => import('./infinite-select/multiple')),
  'infinite-select/slot-empty': lazy(() => import('./infinite-select/slot-empty')),
  'infinite-select/slot-loading': lazy(() => import('./infinite-select/slot-loading')),
  'infinite-select/slot-error': lazy(() => import('./infinite-select/slot-error')),
  'infinite-select/footer': lazy(() => import('./infinite-select/footer')),
  'infinite-select/virtualized': lazy(() => import('./infinite-select/virtualized')),
  'infinite-select/render-item': lazy(() => import('./infinite-select/render-item')),
  'scroll-area/basic': lazy(() => import('./scroll-area/basic')),
  'scroll-area/horizontal': lazy(() => import('./scroll-area/horizontal')),
  'scroll-area/scrollbars': lazy(() => import('./scroll-area/scrollbars')),
  'scroll-area/scroll-fade': lazy(() => import('./scroll-area/scroll-fade')),
  'utils/controllable-state': lazy(() => import('./utils/controllable-state')),
}

export function DemoRenderer({ name }: { name: string }): ReactElement {
  const Demo = registry[name]

  if (Demo === undefined) {
    return (
      <p className="text-sm text-muted-foreground">
        Demo not found:
        {' '}
        <code>{name}</code>
      </p>
    )
  }

  return (
    <Suspense fallback={null}>
      <Demo />
    </Suspense>
  )
}
