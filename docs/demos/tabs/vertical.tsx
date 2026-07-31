import type { ReactElement } from 'react'
import { Tab, TabIndicator, TabList, TabPanel, Tabs } from '@gedatou/cadenza-ui'

// orientation="vertical" 时 TabList 竖排在左、面板在右;
// 方向键也跟着换轴(上下键切换 tab),这是 RAC 按 orientation 自动处理的
// 指示器同样换轴:改成上下滑动、高度补间
export default function VerticalDemo(): ReactElement {
  return (
    <Tabs className="flex gap-4" defaultSelectedKey="overview" orientation="vertical">
      <TabList aria-label="项目仪表盘">
        <TabIndicator />
        <Tab id="overview">概览</Tab>
        <Tab id="analytics">分析</Tab>
        <Tab id="reports">报告</Tab>
        <Tab id="settings">设置</Tab>
      </TabList>
      <TabPanel className="flex-1 min-block-32" id="overview">
        <p className="text-sm text-muted-foreground">项目整体进度、成员活跃度与本周关键指标一览。</p>
      </TabPanel>
      <TabPanel className="flex-1 min-block-32" id="analytics">
        <p className="text-sm text-muted-foreground">访问来源、转化漏斗与留存曲线的细分数据。</p>
      </TabPanel>
      <TabPanel className="flex-1 min-block-32" id="reports">
        <p className="text-sm text-muted-foreground">按周与按月自动生成的报告,支持导出与订阅。</p>
      </TabPanel>
      <TabPanel className="flex-1 min-block-32" id="settings">
        <p className="text-sm text-muted-foreground">项目名称、协作权限与通知规则的配置项。</p>
      </TabPanel>
    </Tabs>
  )
}
