import type { ReactElement } from 'react'
import { Tab, TabIndicator, TabList, TabPanel, Tabs } from '@gedatou/cadenza-ui'

// 两档对比,聚焦后按方向键试试:
//   默认(手动)—— 方向键只移动焦点,Enter/Space 才切换面板。面板加载昂贵时
//                (请求、大图表)不会被键盘路过时误触发。指示器跟着焦点走,
//                正是它「即将选中的那个」语义最有用的场景
//   activateOnFocus —— 焦点走到哪就切到哪
export default function KeyboardActivationDemo(): ReactElement {
  return (
    <div className="flex flex-col gap-8">
      <Tabs defaultValue="overview">
        <TabList aria-label="手动激活(默认)">
          <TabIndicator />
          <Tab value="overview">概览</Tab>
          <Tab value="analytics">分析</Tab>
          <Tab value="reports">报告</Tab>
        </TabList>
        <TabPanel value="overview">
          <p className="text-sm text-muted-foreground">
            方向键会把焦点移到相邻标签,但面板不跟着切换。
          </p>
        </TabPanel>
        <TabPanel value="analytics">
          <p className="text-sm text-muted-foreground">
            分析面板要拉一次埋点数据,按 Enter / Space 确认后才加载。
          </p>
        </TabPanel>
        <TabPanel value="reports">
          <p className="text-sm text-muted-foreground">
            报告面板同理,避免键盘路过时白白发一次请求。
          </p>
        </TabPanel>
      </Tabs>

      <Tabs defaultValue="overview">
        <TabList activateOnFocus aria-label="随焦点激活">
          <TabIndicator />
          <Tab value="overview">概览</Tab>
          <Tab value="analytics">分析</Tab>
          <Tab value="reports">报告</Tab>
        </TabList>
        <TabPanel value="overview">
          <p className="text-sm text-muted-foreground">这一组焦点走到哪,面板就切到哪。</p>
        </TabPanel>
        <TabPanel value="analytics">
          <p className="text-sm text-muted-foreground">面板内容便宜时这样更顺手。</p>
        </TabPanel>
        <TabPanel value="reports">
          <p className="text-sm text-muted-foreground">少按一次 Enter。</p>
        </TabPanel>
      </Tabs>
    </div>
  )
}
