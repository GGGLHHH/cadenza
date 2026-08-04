import type { ReactElement } from 'react'
import { Tab, TabIndicator, TabList, TabPanel, Tabs } from '@gedatou/cadenza-ui'

// 禁用是逐个 tab 声明的,Base UI 没有根上的禁用集合 —— 禁用集合由数据算出来时
// 就在 map 里写 disabled={ids.has(id)}。禁用的 tab 会被键盘导航跳过,
// 指示器也不会跟到禁用的 tab 上 —— 悬停它时指示器留在当前选中项。
export default function DisabledDemo(): ReactElement {
  return (
    <Tabs defaultValue="overview">
      <TabList aria-label="项目仪表盘">
        <TabIndicator />
        <Tab value="overview">概览</Tab>
        <Tab disabled value="analytics">分析</Tab>
        <Tab disabled value="reports">报告</Tab>
        <Tab value="settings">设置</Tab>
      </TabList>
      <TabPanel value="overview">
        <p className="text-sm text-muted-foreground">
          本周新增 12 个任务,3 个里程碑按期完成。
        </p>
      </TabPanel>
      <TabPanel value="analytics">
        <p className="text-sm text-muted-foreground">数据采集尚未接入。</p>
      </TabPanel>
      <TabPanel value="reports">
        <p className="text-sm text-muted-foreground">当前账号没有查看报告的权限。</p>
      </TabPanel>
      <TabPanel value="settings">
        <p className="text-sm text-muted-foreground">
          在这里配置项目成员、通知与集成。
        </p>
      </TabPanel>
    </Tabs>
  )
}
