import type { CascaderNode } from '@gedatou/cadenza-ui'
import type { ReactElement } from 'react'
import { Cascader } from '@gedatou/cadenza-ui'

// 虚拟化:每个面板经固定行高(rowHeight,默认 32)的虚拟窗口渲染,
// 万级子节点不塞满 DOM;重开时自动滚到选中项所在位置。
// 键盘天花板:上游 Menu 没有虚拟化支持,typeahead 与 Home/End 只见
// 已挂载的窗口;方向键逐行走不受影响。
const CATEGORIES: CascaderNode[] = [
  {
    value: 'common',
    label: '常用分类',
    items: Array.from({ length: 8 }, (_, index) => ({
      value: `c${index}`,
      label: `常用 ${index + 1}`,
    })),
  },
  {
    value: 'all',
    label: '全部条目（10000）',
    items: Array.from({ length: 10000 }, (_, index) => ({
      value: `n${index}`,
      label: `条目 ${index + 1}`,
    })),
  },
]

export default function VirtualizedDemo(): ReactElement {
  return <Cascader aria-label="分类" items={CATEGORIES} placeholder="选择条目" virtualized />
}
