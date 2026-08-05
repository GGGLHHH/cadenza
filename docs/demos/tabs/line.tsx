import type { ReactElement } from 'react'
import { Tabs, TabsList, TabsPanel, TabsTab } from '@gedatou/cadenza-ui'

// variant="line" 只换外观:去掉胶囊底色,改成底部一条 2px 指示线;
// 同一个指示器(默认在场)在 line 变体下换个形状,滑动与跟随悬停的行为完全一样。
export default function LineDemo(): ReactElement {
  return (
    <Tabs defaultValue="overview">
      <TabsList aria-label="项目仪表盘" variant="line">
        <TabsTab value="overview">概览</TabsTab>
        <TabsTab value="analytics">分析</TabsTab>
        <TabsTab value="reports">报告</TabsTab>
      </TabsList>
      <TabsPanel className="pbs-4 text-sm text-muted-foreground" value="overview">
        项目当前进度、成员分工与近期里程碑的汇总视图。
      </TabsPanel>
      <TabsPanel className="pbs-4 text-sm text-muted-foreground" value="analytics">
        访问量、留存与转化的趋势数据,支持按周或按月查看。
      </TabsPanel>
      <TabsPanel className="pbs-4 text-sm text-muted-foreground" value="reports">
        已归档的周报与月报,可导出为 PDF 或 CSV。
      </TabsPanel>
    </Tabs>
  )
}
