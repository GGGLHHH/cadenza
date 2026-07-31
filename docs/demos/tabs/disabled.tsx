import type { ReactElement } from 'react'
import { Tab, TabIndicator, TabList, TabPanel, Tabs } from '@gedatou/cadenza-ui'

// 两种禁用写法等价:「分析」用 <Tab isDisabled> 就近声明,「报告」由根上的 disabledKeys 控制,
// 后者适合禁用集合由数据算出来的场景。禁用的 tab 会被键盘导航跳过,
// 指示器也不会跟到禁用的 tab 上 —— 悬停它时指示器留在当前选中项。
export default function DisabledDemo(): ReactElement {
  return (
    <Tabs defaultSelectedKey="overview" disabledKeys={['reports']}>
      <TabList aria-label="项目仪表盘">
        <TabIndicator />
        <Tab id="overview">概览</Tab>
        <Tab id="analytics" isDisabled>分析</Tab>
        <Tab id="reports">报告</Tab>
        <Tab id="settings">设置</Tab>
      </TabList>
      <TabPanel id="overview">
        <p className="text-sm text-muted-foreground">
          本周新增 12 个任务,3 个里程碑按期完成。
        </p>
      </TabPanel>
      <TabPanel id="analytics">
        <p className="text-sm text-muted-foreground">数据采集尚未接入。</p>
      </TabPanel>
      <TabPanel id="reports">
        <p className="text-sm text-muted-foreground">当前账号没有查看报告的权限。</p>
      </TabPanel>
      <TabPanel id="settings">
        <p className="text-sm text-muted-foreground">
          在这里配置项目成员、通知与集成。
        </p>
      </TabPanel>
    </Tabs>
  )
}
