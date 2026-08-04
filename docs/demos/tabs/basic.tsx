import type { ReactElement } from 'react'
import { Tabs, TabsIndicator, TabsList, TabsPanel, TabsTab } from '@gedatou/cadenza-ui'

// 非受控用法:defaultValue 指定初始选中,TabsTab 与 TabsPanel 靠同名 value 自动配对
// 方向键切换、aria-controls / aria-labelledby 关联都由 Base UI 处理,无需手写
// TabsIndicator 是那块会滑动的选中底色:鼠标悬停时它就跟过去,移开再滑回选中项
export default function BasicDemo(): ReactElement {
  return (
    <Tabs defaultValue="analytics">
      <TabsList aria-label="项目仪表盘">
        <TabsIndicator />
        <TabsTab value="overview">概览</TabsTab>
        <TabsTab value="analytics">分析</TabsTab>
        <TabsTab value="reports">报告</TabsTab>
      </TabsList>
      <TabsPanel value="overview">
        <p className="text-sm text-muted-foreground">项目整体进度、成员分工与本周待办的汇总视图。</p>
      </TabsPanel>
      <TabsPanel value="analytics">
        <p className="text-sm text-muted-foreground">按周聚合的访问量、留存与转化趋势。</p>
      </TabsPanel>
      <TabsPanel value="reports">
        <p className="text-sm text-muted-foreground">已归档的月度报告,支持导出为 PDF 或 CSV。</p>
      </TabsPanel>
    </Tabs>
  )
}
