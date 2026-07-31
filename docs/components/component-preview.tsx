import type { ReactElement } from 'react'
import type { ComponentPreviewAlign } from '@/components/component-preview-tabs'
import { ComponentPreviewTabs } from '@/components/component-preview-tabs'
import { ComponentSource } from '@/components/component-source'
import { DemoRenderer } from '@/demos'

/**
 * MDX 里 `<ComponentPreview name="data-table/basic" />` 一行搞定:
 * 活 demo 来自客户端 registry(按需 lazy 分包),源码由 RSC 读同一文件高亮。
 */
export function ComponentPreview({
  name,
  align = 'center',
  className,
  previewClassName,
}: {
  /** demos/ 下的路径,不带扩展名,如 "data-table/basic" */
  name: string
  align?: ComponentPreviewAlign
  className?: string
  previewClassName?: string
}): ReactElement {
  return (
    <ComponentPreviewTabs
      className={className}
      previewClassName={previewClassName}
      align={align}
      component={<DemoRenderer name={name} />}
      source={<ComponentSource name={name} />}
      sourcePreview={<ComponentSource name={name} maxLines={3} />}
    />
  )
}
