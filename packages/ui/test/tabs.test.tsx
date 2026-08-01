import type { ReactElement } from 'react'
import type { TabsProps } from '../src/components/tabs'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { Tab, TabIndicator, TabList, TabPanel, Tabs, useTabsState } from '../src/components/tabs'

function renderDashboard(props: Omit<TabsProps, 'children'> = {}): void {
  render(
    <Tabs {...props}>
      <TabList aria-label="项目仪表盘">
        <Tab id="overview">概览</Tab>
        <Tab id="analytics">分析</Tab>
        <Tab id="reports">报告</Tab>
      </TabList>
      <TabPanel id="overview">概览面板</TabPanel>
      <TabPanel id="analytics">分析面板</TabPanel>
      <TabPanel id="reports">报告面板</TabPanel>
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
  it('builds the tab set from `items`, RAC\'s dynamic collection form', () => {
    const items = [{ id: 'a', title: 'A' }, { id: 'b', title: 'B' }]
    render(
      <Tabs>
        <TabList aria-label="动态集合" items={items}>
          {/* `item` is inferred from `items` — the generic seam is what makes that work */}
          {item => <Tab id={item.id}>{item.title}</Tab>}
        </TabList>
        <TabPanel id="a">A 面板</TabPanel>
        <TabPanel id="b">B 面板</TabPanel>
      </Tabs>,
    )
    expect(screen.getAllByRole('tab').map(tab => tab.textContent)).toEqual(['A', 'B'])
    expect(screen.getByRole('tabpanel').textContent).toBe('A 面板')
  })

  it('renders the aria tablist and mounts only the selected panel', () => {
    renderDashboard({ defaultSelectedKey: 'overview' })
    expect(screen.getByRole('tablist', { name: '项目仪表盘' })).not.toBeNull()
    expect(screen.getAllByRole('tab')).toHaveLength(3)
    expect(screen.getByRole('tab', { name: '概览', selected: true })).not.toBeNull()
    expect(screen.getByRole('tab', { name: '分析', selected: false })).not.toBeNull()
    expect(screen.getByRole('tabpanel').textContent).toBe('概览面板')
    expect(screen.queryByText('分析面板')).toBeNull()
  })

  it('swaps the mounted panel when another tab is clicked', async () => {
    renderDashboard({ defaultSelectedKey: 'overview' })
    await userEvent.click(screen.getByRole('tab', { name: '分析' }))
    expect(screen.getByRole('tab', { name: '分析', selected: true })).not.toBeNull()
    expect(screen.getByText('分析面板')).not.toBeNull()
    // The unselected panel is unmounted, not hidden.
    expect(screen.queryByText('概览面板')).toBeNull()
  })

  it('activates the next tab on ArrowRight (automatic activation)', async () => {
    renderDashboard({ defaultSelectedKey: 'overview' })
    // Click the already-selected tab purely to put focus inside the tablist.
    await userEvent.click(screen.getByRole('tab', { name: '概览' }))
    await userEvent.keyboard('{ArrowRight}')
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: '分析' }))
    expect(screen.getByText('分析面板')).not.toBeNull()
  })

  it('manual activation moves focus with ArrowRight but only selects on Enter', async () => {
    renderDashboard({ defaultSelectedKey: 'overview', keyboardActivation: 'manual' })
    await userEvent.click(screen.getByRole('tab', { name: '概览' }))
    await userEvent.keyboard('{ArrowRight}')
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: '分析' }))
    expect(screen.getByText('概览面板')).not.toBeNull()

    await userEvent.keyboard('{Enter}')
    expect(screen.getByRole('tab', { name: '分析', selected: true })).not.toBeNull()
    expect(screen.getByText('分析面板')).not.toBeNull()
  })

  it('never selects a disabled tab', async () => {
    const onSelectionChange = vi.fn()
    render(
      <Tabs defaultSelectedKey="overview" onSelectionChange={onSelectionChange}>
        <TabList aria-label="项目仪表盘">
          <Tab id="overview">概览</Tab>
          <Tab id="reports" isDisabled>报告</Tab>
        </TabList>
        <TabPanel id="overview">概览面板</TabPanel>
        <TabPanel id="reports">报告面板</TabPanel>
      </Tabs>,
    )
    const disabled = screen.getByRole('tab', { name: '报告' })
    expect(disabled.getAttribute('aria-disabled')).toBe('true')

    await userEvent.click(disabled)
    expect(onSelectionChange).not.toHaveBeenCalled()
    expect(screen.getByRole('tab', { name: '报告', selected: false })).not.toBeNull()
    expect(screen.getByText('概览面板')).not.toBeNull()
  })

  it('keeps a controlled selectedKey pinned to the prop while still reporting the change', async () => {
    const onSelectionChange = vi.fn()
    renderDashboard({ onSelectionChange, selectedKey: 'overview' })
    await userEvent.click(screen.getByRole('tab', { name: '报告' }))
    expect(onSelectionChange).toHaveBeenCalledWith('reports')
    expect(screen.getByRole('tab', { name: '概览', selected: true })).not.toBeNull()
    expect(screen.getByText('概览面板')).not.toBeNull()
    expect(screen.queryByText('报告面板')).toBeNull()
  })
})

describe('tabIndicator', () => {
  function renderWithIndicator(): void {
    render(
      <Tabs defaultSelectedKey="overview">
        <TabList aria-label="项目仪表盘">
          <TabIndicator />
          <Tab id="overview">概览</Tab>
          <Tab id="analytics">分析</Tab>
        </TabList>
        <TabPanel id="overview">概览面板</TabPanel>
        <TabPanel id="analytics">分析面板</TabPanel>
      </Tabs>,
    )
  }

  it('renders outside the tablist, since RAC only renders its collection', () => {
    renderWithIndicator()
    const indicator = document.querySelector('[data-slot="tab-indicator"]')
    expect(indicator).not.toBeNull()
    // Inside the strip container, but not inside the tablist itself: RAC drops
    // any TabList child that is not a collection item.
    expect(indicator?.closest('[data-slot="tab-list-container"]')).not.toBeNull()
    expect(indicator?.closest('[role="tablist"]')).toBeNull()
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

  it('mirrors the list variant onto the container so the indicator can read it', () => {
    render(
      <Tabs>
        <TabList aria-label="t" variant="line">
          <TabIndicator />
          <Tab id="a">A</Tab>
        </TabList>
        <TabPanel id="a">A 面板</TabPanel>
      </Tabs>,
    )
    const container = document.querySelector('[data-slot="tab-list-container"]')
    expect(container?.getAttribute('data-variant')).toBe('line')
  })
})

describe('useTabsState', () => {
  // Must be a direct child of Tabs, and must tolerate the null it gets during
  // RAC's hidden collection pass — both are load-bearing, see the hook's docs.
  function Position(): ReactElement | null {
    const state = useTabsState()
    if (state === null)
      return null
    return <span>{`${String(state.selectedKey)}/${state.collection.size}`}</span>
  }

  it('reads the selection from a direct child of Tabs', () => {
    render(
      <Tabs defaultSelectedKey="analytics">
        <TabList aria-label="t">
          <Tab id="overview">概览</Tab>
          <Tab id="analytics">分析</Tab>
        </TabList>
        <Position />
        <TabPanel id="overview">概览面板</TabPanel>
        <TabPanel id="analytics">分析面板</TabPanel>
      </Tabs>,
    )
    expect(screen.getByText('analytics/2')).not.toBeNull()
  })

  it('forwards ref on the re-exported root — the seam types restate what RAC already does', () => {
    const ref = createRef<HTMLDivElement>()
    renderDashboard({ ref })
    expect(ref.current?.dataset.slot).toBe('tabs')
  })

  it('resolves a function className on Tab against its render props', () => {
    // Tab is the component RAC's own docs demo function className on. The
    // function crosses the vendored TabsTrigger's cn call — composing in cn is
    // what keeps it alive through that hop.
    render(
      <Tabs defaultSelectedKey="analytics">
        <TabList aria-label="t">
          <Tab className={({ isSelected }) => isSelected ? 'underline' : 'line-through'} id="overview">概览</Tab>
          <Tab className={({ isSelected }) => isSelected ? 'underline' : 'line-through'} id="analytics">分析</Tab>
        </TabList>
        <TabPanel id="analytics">分析面板</TabPanel>
      </Tabs>,
    )
    expect(screen.getByRole('tab', { name: '分析' }).className).toContain('underline')
    expect(screen.getByRole('tab', { name: '概览' }).className).toContain('line-through')
  })

  it('is null inside a TabPanel — RAC resets the context so nested Tabs stay isolated', () => {
    render(
      <Tabs defaultSelectedKey="analytics">
        <TabList aria-label="t">
          <Tab id="analytics">分析</Tab>
        </TabList>
        <TabPanel id="analytics">
          <Position />
          面板
        </TabPanel>
      </Tabs>,
    )
    expect(screen.getByRole('tabpanel').textContent).toBe('面板')
  })
})
