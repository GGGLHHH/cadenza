import type { ReactElement } from 'react'
import { Tab, TabIndicator, TabList, TabPanel, Tabs } from '@gedatou/cadenza-ui'

// variant="line" 只换外观:去掉胶囊底色,改成底部一条 2px 指示线;
// 同一个 TabIndicator 换个形状,滑动与跟随悬停的行为完全一样。
export default function LineDemo(): ReactElement {
  return (
    <Tabs defaultValue="overview">
      <TabList aria-label="项目仪表盘" variant="line">
        <TabIndicator />
        <Tab value="overview">概览</Tab>
        <Tab value="analytics">分析</Tab>
        <Tab value="reports">报告</Tab>
      </TabList>
      <TabPanel className="pbs-4 text-sm text-muted-foreground" value="overview">
        项目当前进度、成员分工与近期里程碑的汇总视图。
      </TabPanel>
      <TabPanel className="pbs-4 text-sm text-muted-foreground" value="analytics">
        访问量、留存与转化的趋势数据,支持按周或按月查看。
      </TabPanel>
      <TabPanel className="pbs-4 text-sm text-muted-foreground" value="reports">
        已归档的周报与月报,可导出为 PDF 或 CSV。
      </TabPanel>
    </Tabs>
  )
}
