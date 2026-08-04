import type { TabsProps } from '../src/components/tabs'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { Tab, TabIndicator, TabList, TabPanel, Tabs } from '../src/components/tabs'

function renderDashboard(props: Omit<TabsProps, 'children'> = {}): void {
  render(
    <Tabs {...props}>
      <TabList aria-label="项目仪表盘">
        <Tab value="overview">概览</Tab>
        <Tab value="analytics">分析</Tab>
        <Tab value="reports">报告</Tab>
      </TabList>
      <TabPanel value="overview">概览面板</TabPanel>
      <TabPanel value="analytics">分析面板</TabPanel>
      <TabPanel value="reports">报告面板</TabPanel>
    </Tabs>,
  )
}

beforeAll(() => {
  // TabIndicator re-measures on resize; jsdom has no ResizeObserver.
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
        <TabList aria-label="动态集合">
          {items.map(item => <Tab key={item.id} value={item.id}>{item.title}</Tab>)}
        </TabList>
        <TabPanel value="a">A 面板</TabPanel>
        <TabPanel value="b">B 面板</TabPanel>
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
        <TabList activateOnFocus aria-label="项目仪表盘">
          <Tab value="overview">概览</Tab>
          <Tab value="analytics">分析</Tab>
        </TabList>
        <TabPanel value="overview">概览面板</TabPanel>
        <TabPanel value="analytics">分析面板</TabPanel>
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
        <TabList aria-label="项目仪表盘">
          <Tab value="overview">概览</Tab>
          <Tab disabled value="reports">报告</Tab>
        </TabList>
        <TabPanel value="overview">概览面板</TabPanel>
        <TabPanel value="reports">报告面板</TabPanel>
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

  it('resolves a function className on Tab against its Base UI state', () => {
    // The function crosses the vendored TabsTrigger's cn call — composing in cn
    // is what keeps it alive through that hop.
    render(
      <Tabs defaultValue="analytics">
        <TabList aria-label="t">
          <Tab className={({ active }) => active ? 'underline' : 'line-through'} value="overview">概览</Tab>
          <Tab className={({ active }) => active ? 'underline' : 'line-through'} value="analytics">分析</Tab>
        </TabList>
        <TabPanel value="analytics">分析面板</TabPanel>
      </Tabs>,
    )
    expect(screen.getByRole('tab', { name: '分析' }).className).toContain('underline')
    expect(screen.getByRole('tab', { name: '概览' }).className).toContain('line-through')
  })
})

describe('tabIndicator', () => {
  function renderWithIndicator(): void {
    render(
      <Tabs defaultValue="overview">
        <TabList aria-label="项目仪表盘">
          <TabIndicator />
          <Tab value="overview">概览</Tab>
          <Tab value="analytics">分析</Tab>
        </TabList>
        <TabPanel value="overview">概览面板</TabPanel>
        <TabPanel value="analytics">分析面板</TabPanel>
      </Tabs>,
    )
  }

  it('renders inside the tablist, as a sibling of the tabs it measures', () => {
    // Base UI's List renders its children as written, so the indicator lives
    // where it is composed — no marker lifting, and `parentElement` is the very
    // element it measures against.
    renderWithIndicator()
    const indicator = document.querySelector('[data-slot="tab-indicator"]')
    expect(indicator).not.toBeNull()
    expect(indicator?.closest('[role="tablist"]')).not.toBeNull()
  })

  it('leaves the tabs and panels untouched', () => {
    renderWithIndicator()
    expect(screen.getAllByRole('tab')).toHaveLength(2)
    expect(screen.getByRole('tab', { name: '概览', selected: true })).not.toBeNull()
    expect(screen.getByRole('tabpanel').textContent).toBe('概览面板')
  })

  it('stays unplaced while the strip has no layout', () => {
    // jsdom reports every tab as 0×0 — the same reading a strip gives before
    // its stylesheet applies, or inside a force-mounted (hidden) panel.
    // Placing there would spend the one un-animated placement on a bogus
    // position, leaving the first real measurement to slide in from the corner.
    renderWithIndicator()
    const style = document.querySelector<HTMLElement>('[data-slot="tab-indicator"]')?.style
    expect(style?.opacity).toBe('0')
    expect(style?.transform).toBe('')
  })

  it('reads the variant off the list, which is its own parent', () => {
    render(
      <Tabs defaultValue="a">
        <TabList aria-label="t" variant="line">
          <TabIndicator />
          <Tab value="a">A</Tab>
        </TabList>
        <TabPanel value="a">A 面板</TabPanel>
      </Tabs>,
    )
    const list = document.querySelector('[data-slot="tabs-list"]')
    expect(list?.getAttribute('data-variant')).toBe('line')
    expect(document.querySelector('[data-slot="tab-indicator"]')?.parentElement).toBe(list)
  })
})
