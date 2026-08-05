import type { ReactElement } from 'react'
import { Tabs, TabsList, TabsPanel, TabsTab } from '@gedatou/cadenza-ui'

// 两档对比,聚焦后按方向键试试:
//   默认(手动)—— 方向键只移动焦点,Enter/Space 才切换面板。面板加载昂贵时
//                (请求、大图表)不会被键盘路过时误触发。指示器跟着焦点走,
//                正是它「即将选中的那个」语义最有用的场景
//   activateOnFocus —— 焦点走到哪就切到哪
export default function KeyboardActivationDemo(): ReactElement {
  return (
    <div className="flex flex-col gap-8">
      <Tabs defaultValue="overview">
        <TabsList aria-label="手动激活(默认)">
          <TabsTab value="overview">概览</TabsTab>
          <TabsTab value="analytics">分析</TabsTab>
          <TabsTab value="reports">报告</TabsTab>
        </TabsList>
        <TabsPanel value="overview">
          <p className="text-sm text-muted-foreground">
            方向键会把焦点移到相邻标签,但面板不跟着切换。
          </p>
        </TabsPanel>
        <TabsPanel value="analytics">
          <p className="text-sm text-muted-foreground">
            分析面板要拉一次埋点数据,按 Enter / Space 确认后才加载。
          </p>
        </TabsPanel>
        <TabsPanel value="reports">
          <p className="text-sm text-muted-foreground">
            报告面板同理,避免键盘路过时白白发一次请求。
          </p>
        </TabsPanel>
      </Tabs>

      <Tabs defaultValue="overview">
        <TabsList activateOnFocus aria-label="随焦点激活">
          <TabsTab value="overview">概览</TabsTab>
          <TabsTab value="analytics">分析</TabsTab>
          <TabsTab value="reports">报告</TabsTab>
        </TabsList>
        <TabsPanel value="overview">
          <p className="text-sm text-muted-foreground">这一组焦点走到哪,面板就切到哪。</p>
        </TabsPanel>
        <TabsPanel value="analytics">
          <p className="text-sm text-muted-foreground">面板内容便宜时这样更顺手。</p>
        </TabsPanel>
        <TabsPanel value="reports">
          <p className="text-sm text-muted-foreground">少按一次 Enter。</p>
        </TabsPanel>
      </Tabs>
    </div>
  )
}
