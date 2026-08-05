import type { ReactElement } from 'react'
import { Tabs, TabsList, TabsPanel, TabsTab } from '@gedatou/cadenza-ui'
import { useState } from 'react'
import { DemoButton } from '../lib/demo-button'

const TAB_VALUES = ['overview', 'analytics', 'reports']

// 受控:选中态放在外部 useState,Tabs 只负责渲染 ——
// 外面的「下一个」按钮直接改 state 就能切换,证明 value 是唯一数据源;
// 指示器跟着外部状态滑动,和点标签切换没有区别
export default function ControlledDemo(): ReactElement {
  const [value, setValue] = useState('overview')

  return (
    <div className="flex flex-col gap-4">
      <Tabs value={value} onValueChange={setValue}>
        <TabsList aria-label="项目仪表盘">
          <TabsTab value="overview">概览</TabsTab>
          <TabsTab value="analytics">分析</TabsTab>
          <TabsTab value="reports">报告</TabsTab>
        </TabsList>
        <TabsPanel value="overview">
          <p className="text-sm text-muted-foreground">项目整体进度与本周关键指标。</p>
        </TabsPanel>
        <TabsPanel value="analytics">
          <p className="text-sm text-muted-foreground">访问趋势、转化漏斗与来源分布。</p>
        </TabsPanel>
        <TabsPanel value="reports">
          <p className="text-sm text-muted-foreground">已生成的周报与月报归档。</p>
        </TabsPanel>
      </Tabs>
      <div className="flex items-center gap-3">
        <DemoButton
          onClick={() => {
            const next = (TAB_VALUES.indexOf(value) + 1) % TAB_VALUES.length
            setValue(TAB_VALUES[next])
          }}
        >
          下一个
        </DemoButton>
        <span className="text-sm text-muted-foreground">
          当前选中:
          {value}
        </span>
      </div>
    </div>
  )
}
