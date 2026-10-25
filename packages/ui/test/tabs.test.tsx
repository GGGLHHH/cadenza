import type { TabsProps } from '../src/components/tabs'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { Tabs, TabsIndicator, TabsList, TabsPanel, TabsTab } from '../src/components/tabs'

function renderDashboard(props: Omit<TabsProps, 'children'> = {}): void {
  render(
    <Tabs {...props}>
      <TabsList aria-label="项目仪表盘">
        <TabsTab value="overview">概览</TabsTab>
        <TabsTab value="analytics">分析</TabsTab>
        <TabsTab value="reports">报告</TabsTab>
      </TabsList>
      <TabsPanel value="overview">概览面板</TabsPanel>
      <TabsPanel value="analytics">分析面板</TabsPanel>
      <TabsPanel value="reports">报告面板</TabsPanel>
    </Tabs>,
  )
}

beforeAll(() => {
  // animate-ui's list and panels observe size changes; jsdom has no ResizeObserver.
  vi.stubGlobal('ResizeObserver', class {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  })
})

describe('tabs', () => {
  it('builds a tab set from data with a plain map', () => {
    // Base UI has no collection API — a computed tab set is ordinary JSX.
    const items = [{ id: 'a', title: 'A' }, { id: 'b', title: 'B' }]
    render(
      <Tabs defaultValue="a">
        <TabsList aria-label="动态集合">
          {items.map(item => <TabsTab key={item.id} value={item.id}>{item.title}</TabsTab>)}
        </TabsList>
        <TabsPanel value="a">A 面板</TabsPanel>
        <TabsPanel value="b">B 面板</TabsPanel>
      </Tabs>,
    )
    expect(screen.getAllByRole('tab').map(tab => tab.textContent)).toEqual(['A', 'B'])
    expect(screen.getByRole('tabpanel').textContent).toBe('A 面板')
  })

  it('renders the aria tablist and mounts only the selected panel', () => {
    renderDashboard({ defaultValue: 'overview' })
    expect(screen.getByRole('tablist', { name: '项目仪表盘' })).not.toBeNull()
    expect(screen.getAllByRole('tab')).toHaveLength(3)
    expect(screen.getByRole('tab', { name: '概览', selected: true })).not.toBeNull()
    expect(screen.getByRole('tab', { name: '分析', selected: false })).not.toBeNull()
    expect(screen.getByRole('tabpanel').textContent).toBe('概览面板')
    expect(screen.queryByText('分析面板')).toBeNull()
  })

  it('swaps the mounted panel when another tab is clicked', async () => {
    renderDashboard({ defaultValue: 'overview' })
    await userEvent.click(screen.getByRole('tab', { name: '分析' }))
    expect(screen.getByRole('tab', { name: '分析', selected: true })).not.toBeNull()
    expect(screen.getByText('分析面板')).not.toBeNull()
    // The unselected panel is unmounted, not hidden.
    expect(screen.queryByText('概览面板')).toBeNull()
  })

  it('arrowRight only moves focus by default — Base UI activates manually', async () => {
    // The opposite of React Aria's default, and the upstream choice we follow:
    // arrow keys walk the strip, Enter or Space commits.
    renderDashboard({ defaultValue: 'overview' })
    // Click the already-selected tab purely to put focus inside the tablist.
    await userEvent.click(screen.getByRole('tab', { name: '概览' }))
    await userEvent.keyboard('{ArrowRight}')
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: '分析' }))
    expect(screen.getByText('概览面板')).not.toBeNull()

    await userEvent.keyboard('{Enter}')
    expect(screen.getByRole('tab', { name: '分析', selected: true })).not.toBeNull()
    expect(screen.getByText('分析面板')).not.toBeNull()
  })

  it('activateOnFocus makes ArrowRight select as it moves', async () => {
    render(
      <Tabs defaultValue="overview">
        <TabsList activateOnFocus aria-label="项目仪表盘">
          <TabsTab value="overview">概览</TabsTab>
          <TabsTab value="analytics">分析</TabsTab>
        </TabsList>
        <TabsPanel value="overview">概览面板</TabsPanel>
        <TabsPanel value="analytics">分析面板</TabsPanel>
      </Tabs>,
    )
    await userEvent.click(screen.getByRole('tab', { name: '概览' }))
    await userEvent.keyboard('{ArrowRight}')
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: '分析' }))
    expect(screen.getByText('分析面板')).not.toBeNull()
  })

  it('never selects a disabled tab', async () => {
    const onValueChange = vi.fn()
    render(
      <Tabs defaultValue="overview" onValueChange={onValueChange}>
        <TabsList aria-label="项目仪表盘">
          <TabsTab value="overview">概览</TabsTab>
          <TabsTab disabled value="reports">报告</TabsTab>
        </TabsList>
        <TabsPanel value="overview">概览面板</TabsPanel>
        <TabsPanel value="reports">报告面板</TabsPanel>
      </Tabs>,
    )
    const disabled = screen.getByRole('tab', { name: '报告' })

    await userEvent.click(disabled)
    expect(onValueChange).not.toHaveBeenCalled()
    expect(screen.getByRole('tab', { name: '报告', selected: false })).not.toBeNull()
    expect(screen.getByText('概览面板')).not.toBeNull()
  })

  it('keeps a controlled value pinned to the prop while still reporting the change', async () => {
    const onValueChange = vi.fn()
    renderDashboard({ onValueChange, value: 'overview' })
    await userEvent.click(screen.getByRole('tab', { name: '报告' }))
    expect(onValueChange).toHaveBeenCalledWith('reports', expect.anything())
    expect(screen.getByRole('tab', { name: '概览', selected: true })).not.toBeNull()
    expect(screen.getByText('概览面板')).not.toBeNull()
    expect(screen.queryByText('报告面板')).toBeNull()
  })

  it('forwards ref on the re-exported root', () => {
    const ref = createRef<HTMLDivElement>()
    renderDashboard({ ref })
    expect(ref.current?.dataset.slot).toBe('tabs')
  })

  it('resolves a function className on TabsTab against its Base UI state', () => {
    // The function crosses the vendored TabsTrigger's cn call — composing in cn
    // is what keeps it alive through that hop.
    render(
      <Tabs defaultValue="analytics">
        <TabsList aria-label="t">
          <TabsTab className={({ active }) => active ? 'underline' : 'line-through'} value="overview">概览</TabsTab>
          <TabsTab className={({ active }) => active ? 'underline' : 'line-through'} value="analytics">分析</TabsTab>
        </TabsList>
        <TabsPanel value="analytics">分析面板</TabsPanel>
      </Tabs>,
    )
    expect(screen.getByRole('tab', { name: '分析' }).className).toContain('underline')
    expect(screen.getByRole('tab', { name: '概览' }).className).toContain('line-through')
  })
})

describe('tabs animation (animate-ui)', () => {
  // The sliding indicator clones the selected tab's computed box look, which
  // jsdom never paints (no stylesheet), so the automatic one is
  // browser-verified. What is testable here is the seam's own contract.
  it('a composed TabsIndicator is Base UI\'s, inside the tablist, with the caller\'s class', () => {
    render(
      <Tabs defaultValue="a">
        <TabsList aria-label="自己的">
          <TabsIndicator className="opacity-90" />
          <TabsTab value="a">A</TabsTab>
        </TabsList>
        <TabsPanel value="a">面板</TabsPanel>
      </Tabs>,
    )
    const indicators = document.querySelectorAll('[data-slot="tabs-indicator"]')
    expect(indicators.length).toBe(1)
    expect(indicators[0]?.closest('[role="tablist"]')).not.toBeNull()
    expect(indicators[0]?.className).toContain('opacity-90')
  })

  it('indicator={false} leaves the tabs and panels working', async () => {
    render(
      <Tabs defaultValue="a">
        <TabsList aria-label="关掉" indicator={false}>
          <TabsTab value="a">A</TabsTab>
          <TabsTab value="b">B</TabsTab>
        </TabsList>
        <TabsPanel value="a">甲</TabsPanel>
        <TabsPanel value="b">乙</TabsPanel>
      </Tabs>,
    )
    await userEvent.click(screen.getByRole('tab', { name: 'B' }))
    expect(screen.getByRole('tab', { name: 'B', selected: true })).not.toBeNull()
    expect(screen.getByRole('tabpanel').textContent).toBe('乙')
  })

  it('animated={false} still swaps panels', async () => {
    render(
      <Tabs defaultValue="a">
        <TabsList aria-label="关动画">
          <TabsTab value="a">A</TabsTab>
          <TabsTab value="b">B</TabsTab>
        </TabsList>
        <TabsPanel animated={false} value="a">甲</TabsPanel>
        <TabsPanel animated={false} value="b">乙</TabsPanel>
      </Tabs>,
    )
    await userEvent.click(screen.getByRole('tab', { name: 'B' }))
    expect(screen.getByRole('tabpanel').textContent).toBe('乙')
    expect(screen.queryByText('甲')).toBeNull()
  })

  it('vertical: orientation reaches Base UI — aria-orientation and the arrow-key axis follow', async () => {
    // Regression pin for the vendored-root bug: shadcn's base-nova root
    // destructures `orientation` into a cosmetic data attribute and never
    // forwards it, leaving Base UI horizontal forever (no aria-orientation,
    // wrong arrow axis, activation direction stuck at 'none').
    const user = userEvent.setup()
    render(
      <Tabs defaultValue="a" orientation="vertical">
        <TabsList aria-label="纵向">
          <TabsTab value="a">A</TabsTab>
          <TabsTab value="b">B</TabsTab>
        </TabsList>
        <TabsPanel value="a">甲</TabsPanel>
        <TabsPanel value="b">乙</TabsPanel>
      </Tabs>,
    )
    const list = screen.getByRole('tablist', { name: '纵向' })
    expect(list.getAttribute('aria-orientation')).toBe('vertical')
    expect(document.querySelector('[data-slot="tabs"]')?.getAttribute('data-orientation')).toBe('vertical')

    await user.click(screen.getByRole('tab', { name: 'A' }))
    await user.keyboard('{ArrowDown}')
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'B' }))
  })
})
