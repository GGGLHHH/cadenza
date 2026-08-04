import type { ReactElement } from 'react'
import { Tab, TabIndicator, TabList, TabPanel, Tabs } from '@gedatou/cadenza-ui'

// 非受控用法:defaultValue 指定初始选中,Tab 与 TabPanel 靠同名 value 自动配对
// 方向键切换、aria-controls / aria-labelledby 关联都由 Base UI 处理,无需手写
// TabIndicator 是那块会滑动的选中底色:鼠标悬停时它就跟过去,移开再滑回选中项
export default function BasicDemo(): ReactElement {
  return (
    <Tabs defaultValue="analytics">
      <TabList aria-label="项目仪表盘">
        <TabIndicator />
        <Tab value="overview">概览</Tab>
        <Tab value="analytics">分析</Tab>
        <Tab value="reports">报告</Tab>
      </TabList>
      <TabPanel value="overview">
        <p className="text-sm text-muted-foreground">项目整体进度、成员分工与本周待办的汇总视图。</p>
      </TabPanel>
      <TabPanel value="analytics">
        <p className="text-sm text-muted-foreground">按周聚合的访问量、留存与转化趋势。</p>
      </TabPanel>
      <TabPanel value="reports">
        <p className="text-sm text-muted-foreground">已归档的月度报告,支持导出为 PDF 或 CSV。</p>
      </TabPanel>
    </Tabs>
  )
}
