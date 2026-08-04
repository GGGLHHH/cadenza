'use client'

import type { ComponentType, ReactElement } from 'react'
import { lazy, Suspense } from 'react'

// 客户端 demo registry:lazy 让每个 demo 独立分包,页面只拉用到的
const registry: Record<string, ComponentType> = {
  'button/variants': lazy(async () => import('./button/variants')),
  'button/sizes': lazy(async () => import('./button/sizes')),
  'button/pending': lazy(async () => import('./button/pending')),
  'button/pending-custom': lazy(async () => import('./button/pending-custom')),
  'button/link': lazy(async () => import('./button/link')),
  'spinner/basic': lazy(async () => import('./spinner/basic')),
  'data-pagination/basic': lazy(async () => import('./data-pagination/basic')),
  'data-pagination/controlled': lazy(async () => import('./data-pagination/controlled')),
  'data-pagination/labels': lazy(async () => import('./data-pagination/labels')),
  'data-table/basic': lazy(async () => import('./data-table/basic')),
  'data-table/sort': lazy(async () => import('./data-table/sort')),
  'data-table/selection-single': lazy(async () => import('./data-table/selection-single')),
  'data-table/selection-multiple': lazy(async () => import('./data-table/selection-multiple')),
  'data-table/selection-archive': lazy(async () => import('./data-table/selection-archive')),
  'data-table/hscroll': lazy(async () => import('./data-table/hscroll')),
  'data-table/pinned': lazy(async () => import('./data-table/pinned')),
  'data-table/pagination': lazy(async () => import('./data-table/pagination')),
  'data-table/infinite': lazy(async () => import('./data-table/infinite')),
  'data-table/slot-empty': lazy(async () => import('./data-table/slot-empty')),
  'data-table/loading': lazy(async () => import('./data-table/loading')),
  'data-table/refresh': lazy(async () => import('./data-table/refresh')),
  'data-table/loading-custom': lazy(async () => import('./data-table/loading-custom')),
  'data-table/slot-error': lazy(async () => import('./data-table/slot-error')),
  'data-table/virtualized': lazy(async () => import('./data-table/virtualized')),
  'data-table/dynamic-row-height': lazy(async () => import('./data-table/dynamic-row-height')),
  'field/basic': lazy(async () => import('./field/basic')),
  'field/select': lazy(async () => import('./field/select')),
  'field/infinite-combobox': lazy(async () => import('./field/infinite-combobox')),
  'field/fieldset': lazy(async () => import('./field/fieldset')),
  'field/separator': lazy(async () => import('./field/separator')),
  'field/responsive': lazy(async () => import('./field/responsive')),
  'field/error': lazy(async () => import('./field/error')),
  'infinite-select/single': lazy(async () => import('./infinite-select/single')),
  'infinite-select/multiple': lazy(async () => import('./infinite-select/multiple')),
  'infinite-select/slot-empty': lazy(async () => import('./infinite-select/slot-empty')),
  'infinite-select/loading': lazy(async () => import('./infinite-select/loading')),
  'infinite-select/loading-custom': lazy(async () => import('./infinite-select/loading-custom')),
  'infinite-select/slot-error': lazy(async () => import('./infinite-select/slot-error')),
  'infinite-select/footer': lazy(async () => import('./infinite-select/footer')),
  'infinite-select/no-more': lazy(async () => import('./infinite-select/no-more')),
  'infinite-select/virtualized': lazy(async () => import('./infinite-select/virtualized')),
  'infinite-select/render-item': lazy(async () => import('./infinite-select/render-item')),
  'input-group/icon': lazy(async () => import('./input-group/icon')),
  'input-group/text': lazy(async () => import('./input-group/text')),
  'input-group/button': lazy(async () => import('./input-group/button')),
  'input-group/kbd': lazy(async () => import('./input-group/kbd')),
  'input-group/textarea': lazy(async () => import('./input-group/textarea')),
  'loading-overlay/basic': lazy(async () => import('./loading-overlay/basic')),
  'loading-overlay/custom': lazy(async () => import('./loading-overlay/custom')),
  'scroll-area/basic': lazy(async () => import('./scroll-area/basic')),
  'scroll-area/horizontal': lazy(async () => import('./scroll-area/horizontal')),
  'scroll-area/scrollbars': lazy(async () => import('./scroll-area/scrollbars')),
  'scroll-area/scroll-fade': lazy(async () => import('./scroll-area/scroll-fade')),
  'select/basic': lazy(async () => import('./select/basic')),
  'select/group': lazy(async () => import('./select/group')),
  'select/multiple': lazy(async () => import('./select/multiple')),
  'select/dynamic': lazy(async () => import('./select/dynamic')),
  'select/empty': lazy(async () => import('./select/empty')),
  'select/disabled': lazy(async () => import('./select/disabled')),
  'search-field/basic': lazy(async () => import('./search-field/basic')),
  'search-field/controlled': lazy(async () => import('./search-field/controlled')),
  'search-field/composition': lazy(async () => import('./search-field/composition')),
  'search-field/disabled': lazy(async () => import('./search-field/disabled')),
  'tabs/basic': lazy(async () => import('./tabs/basic')),
  'tabs/line': lazy(async () => import('./tabs/line')),
  'tabs/vertical': lazy(async () => import('./tabs/vertical')),
  'tabs/controlled': lazy(async () => import('./tabs/controlled')),
  'tabs/disabled': lazy(async () => import('./tabs/disabled')),
  'tabs/keyboard-activation': lazy(async () => import('./tabs/keyboard-activation')),
  'utils/controllable-state': lazy(async () => import('./utils/controllable-state')),
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
