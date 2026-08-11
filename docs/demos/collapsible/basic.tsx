import type { ReactElement } from 'react'
import { Button, Collapsible, CollapsiblePanel, CollapsibleTrigger } from '@gedatou/cadenza-ui'
import { IconChevronDown } from '@tabler/icons-react'

// 最小组合:trigger + panel。展开/收起的高度过渡是封装层的默认值,demo 里
// 一个动画类都不用写 —— 这里唯一的自定义是 chevron 跟着 data-panel-open 转向
export default function BasicDemo(): ReactElement {
  return (
    <Collapsible className="flex flex-col gap-2 inline-80">
      <CollapsibleTrigger
        className="group/trigger justify-between"
        render={<Button variant="outline" />}
      >
        能在商业项目里用吗?
        <IconChevronDown className="
          transition-transform
          group-data-panel-open/trigger:rotate-180
        "
        />
      </CollapsibleTrigger>
      <CollapsiblePanel>
        <p className="rounded-md border p-4 text-sm text-muted-foreground">
          可以。个人和商业项目都免费,不要求署名。
        </p>
      </CollapsiblePanel>
    </Collapsible>
  )
}
