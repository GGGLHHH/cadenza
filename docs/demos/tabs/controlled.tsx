import type { Key } from '@gedatou/cadenza-ui'
import type { ReactElement } from 'react'
import { Tab, TabIndicator, TabList, TabPanel, Tabs } from '@gedatou/cadenza-ui'
import { useState } from 'react'
import { DemoButton } from '../lib/demo-button'

const TAB_KEYS: Key[] = ['overview', 'analytics', 'reports']

// 受控:选中态放在外部 useState,Tabs 只负责渲染 ——
// 外面的「下一个」按钮直接改 state 就能切换,证明 selectedKey 是唯一数据源;
// 指示器跟着外部状态滑动,和点标签切换没有区别
export default function ControlledDemo(): ReactElement {
  const [selectedKey, setSelectedKey] = useState<Key>('overview')

  return (
    <div className="flex flex-col gap-4">
      <Tabs selectedKey={selectedKey} onSelectionChange={setSelectedKey}>
        <TabList aria-label="项目仪表盘">
          <TabIndicator />
          <Tab id="overview">概览</Tab>
          <Tab id="analytics">分析</Tab>
          <Tab id="reports">报告</Tab>
        </TabList>
        <TabPanel id="overview">
          <p className="text-sm text-muted-foreground">项目整体进度与本周关键指标。</p>
        </TabPanel>
        <TabPanel id="analytics">
          <p className="text-sm text-muted-foreground">访问趋势、转化漏斗与来源分布。</p>
        </TabPanel>
        <TabPanel id="reports">
          <p className="text-sm text-muted-foreground">已生成的周报与月报归档。</p>
        </TabPanel>
      </Tabs>
      <div className="flex items-center gap-3">
        <DemoButton
          onPress={() => {
            const next = (TAB_KEYS.indexOf(selectedKey) + 1) % TAB_KEYS.length
            setSelectedKey(TAB_KEYS[next])
          }}
        >
          下一个
        </DemoButton>
        <span className="text-sm text-muted-foreground">
          当前选中:
          {String(selectedKey)}
        </span>
      </div>
    </div>
  )
}
