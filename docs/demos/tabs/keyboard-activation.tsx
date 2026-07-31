import type { ReactElement } from 'react'
import { Tab, TabIndicator, TabList, TabPanel, Tabs } from '@gedatou/cadenza-ui'

// keyboardActivation="manual":方向键只移动焦点,按 Enter/Space 才切换面板;
// 默认的 "automatic" 焦点走到哪就切到哪,面板内容加载昂贵时(请求、大图表)会被路过时误触发。
// 指示器跟着焦点走 —— 这正是它「即将选中的那个」语义最有用的场景。
export default function KeyboardActivationDemo(): ReactElement {
  return (
    <Tabs defaultSelectedKey="overview" keyboardActivation="manual">
      <TabList aria-label="项目仪表盘">
        <TabIndicator />
        <Tab id="overview">概览</Tab>
        <Tab id="analytics">分析</Tab>
        <Tab id="reports">报告</Tab>
      </TabList>
      <TabPanel id="overview">
        <p className="text-sm text-muted-foreground">
          用键盘方向键试试:焦点会移动到相邻标签,但面板不会跟着切换。
        </p>
      </TabPanel>
      <TabPanel id="analytics">
        <p className="text-sm text-muted-foreground">
          分析面板要拉一次埋点数据,按 Enter / Space 确认后才加载。
        </p>
      </TabPanel>
      <TabPanel id="reports">
        <p className="text-sm text-muted-foreground">
          报告面板同理,避免键盘路过时白白发一次请求。
        </p>
      </TabPanel>
    </Tabs>
  )
}
