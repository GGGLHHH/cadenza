import type { CascaderNode } from '@gedatou/cadenza-ui'
import type { ReactElement } from 'react'
import { Cascader } from '@gedatou/cadenza-ui'

// 一行式:不给 children 就渲染完整默认组合 —— Select 同款触发器、路径回显、
// 清除 ✕、弹层与逐级子菜单全部来自 items。悬停或方向键展开下一级,
// 只有叶子可选,选中即提交整条路径并关闭。「甘肃」演示节点级禁用。
const REGIONS: CascaderNode[] = [
  {
    value: 'zhejiang',
    label: '浙江',
    items: [
      {
        value: 'hangzhou',
        label: '杭州',
        items: [
          { value: 'xihu', label: '西湖区' },
          { value: 'binjiang', label: '滨江区' },
        ],
      },
      { value: 'ningbo', label: '宁波', items: [{ value: 'haishu', label: '海曙区' }] },
    ],
  },
  {
    value: 'jiangsu',
    label: '江苏',
    items: [{ value: 'nanjing', label: '南京', items: [{ value: 'xuanwu', label: '玄武区' }] }],
  },
  { value: 'gansu', label: '甘肃', disabled: true },
]

export default function BasicDemo(): ReactElement {
  return <Cascader aria-label="地区" items={REGIONS} placeholder="选择地区" />
}
