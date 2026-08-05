import type { TabsProps } from '../src/components/tabs'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { Tabs, TabsIndicator, TabsList, TabsPanel, TabsTab, TabsViewport } from '../src/components/tabs'

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
  // TabsIndicator re-measures on resize; jsdom has no ResizeObserver.
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

describe('tabIndicator', () => {
  function renderWithIndicator(): void {
    render(
      <Tabs defaultValue="overview">
        <TabsList aria-label="项目仪表盘">
          <TabsIndicator />
          <TabsTab value="overview">概览</TabsTab>
          <TabsTab value="analytics">分析</TabsTab>
        </TabsList>
        <TabsPanel value="overview">概览面板</TabsPanel>
        <TabsPanel value="analytics">分析面板</TabsPanel>
      </Tabs>,
    )
  }

  it('renders inside the tablist, as a sibling of the tabs it measures', () => {
    // Base UI's List renders its children as written, so the indicator lives
    // where it is composed — no marker lifting, and `parentElement` is the very
    // element it measures against.
    renderWithIndicator()
    const indicator = document.querySelector('[data-slot="tabs-indicator"]')
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
    const style = document.querySelector<HTMLElement>('[data-slot="tabs-indicator"]')?.style
    expect(style?.opacity).toBe('0')
    expect(style?.transform).toBe('')
  })

  it('reads the variant off the list, which is its own parent', () => {
    render(
      <Tabs defaultValue="a">
        <TabsList aria-label="t" variant="line">
          <TabsIndicator />
          <TabsTab value="a">A</TabsTab>
        </TabsList>
        <TabsPanel value="a">A 面板</TabsPanel>
      </Tabs>,
    )
    const list = document.querySelector('[data-slot="tabs-list"]')
    expect(list?.getAttribute('data-variant')).toBe('line')
    expect(document.querySelector('[data-slot="tabs-indicator"]')?.parentElement).toBe(list)
  })

  it('wears the sliding indicator by default — the house look needs no composing', () => {
    render(
      <Tabs defaultValue="a">
        <TabsList aria-label="默认在场">
          <TabsTab value="a">A</TabsTab>
        </TabsList>
        <TabsPanel value="a">面板</TabsPanel>
      </Tabs>,
    )
    expect(document.querySelectorAll('[data-slot="tabs-indicator"]').length).toBe(1)
  })

  it('indicator={false} removes the default one', () => {
    render(
      <Tabs defaultValue="a">
        <TabsList aria-label="关掉" indicator={false}>
          <TabsTab value="a">A</TabsTab>
        </TabsList>
        <TabsPanel value="a">面板</TabsPanel>
      </Tabs>,
    )
    expect(document.querySelector('[data-slot="tabs-indicator"]')).toBeNull()
  })

  it('an explicitly composed indicator is yours — the default one steps aside, no doubling', () => {
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
    expect(indicators[0]?.className).toContain('opacity-90')
  })

  it('panels are gathered into an implicit viewport wearing the cross-slide by default', () => {
    render(
      <Tabs defaultValue="a">
        <TabsList aria-label="动画">
          <TabsTab value="a">A</TabsTab>
          <TabsTab value="b">B</TabsTab>
        </TabsList>
        <TabsPanel value="a">甲</TabsPanel>
        <TabsPanel value="b">乙</TabsPanel>
      </Tabs>,
    )
    const viewport = document.querySelector('[data-slot="tabs-viewport"]')
    expect(viewport).not.toBeNull()
    // Both panels live inside it, stacked into the same grid cell — that is
    // what lets outgoing and incoming cross-slide without a layout jump.
    expect(viewport?.querySelectorAll('[data-slot="tabs-panel"]').length).toBe(1) // inactive one unmounts
    const panel = viewport?.querySelector('[data-slot="tabs-panel"]')
    expect(panel?.className).toContain('col-start-1')
    // Base UI's animated-panels numbers, verbatim.
    expect(panel?.className).toContain('[transition:opacity_175ms_ease,translate_350ms_cubic-bezier(0.22,1,0.36,1)]')
    expect(panel?.className).toContain('data-[activation-direction=right]:translate-x-1/2')
    // The list stays outside the viewport.
    expect(viewport?.querySelector('[data-slot="tabs-list"]')).toBeNull()
  })

  it('viewport={false} falls back to the container-free enter-only micro-slide', () => {
    render(
      <Tabs defaultValue="a" viewport={false}>
        <TabsList aria-label="动画">
          <TabsTab value="a">A</TabsTab>
        </TabsList>
        <TabsPanel value="a">面板</TabsPanel>
      </Tabs>,
    )
    expect(document.querySelector('[data-slot="tabs-viewport"]')).toBeNull()
    const panel = document.querySelector('[data-slot="tabs-panel"]')
    expect(panel?.className).toContain('data-[activation-direction=right]:translate-x-2')
    // Load-bearing in the container-free mode: without it Base UI keeps the
    // outgoing panel in flow for the transition window and two panels stack.
    expect(panel?.className).toContain('data-ending-style:hidden')
  })

  it('a composed TabsViewport turns the gathering off — structure is the caller\'s, no nesting', () => {
    render(
      <Tabs defaultValue="a">
        <TabsList aria-label="自己的">
          <TabsTab value="a">A</TabsTab>
        </TabsList>
        <TabsViewport className="opacity-95">
          <TabsPanel value="a">面板</TabsPanel>
        </TabsViewport>
      </Tabs>,
    )
    const viewports = document.querySelectorAll('[data-slot="tabs-viewport"]')
    expect(viewports.length).toBe(1)
    expect(viewports[0]?.className).toContain('opacity-95')
  })

  // Slot channels routinely arrive wrapped in a fragment — the house detector
  // looks through them, a hand-rolled `child.type ===` check does not, and the
  // gathering would wrap a second viewport around the caller's own.
  it('yields to a composed TabsViewport inside a fragment too — never double-wraps', () => {
    render(
      <Tabs defaultValue="a">
        <TabsList aria-label="片段里的">
          <TabsTab value="a">A</TabsTab>
        </TabsList>
        <>
          <TabsViewport className="opacity-95">
            <TabsPanel value="a">面板</TabsPanel>
          </TabsViewport>
        </>
      </Tabs>,
    )
    const viewports = document.querySelectorAll('[data-slot="tabs-viewport"]')
    expect(viewports.length).toBe(1)
    expect(viewports[0]?.className).toContain('opacity-95')
  })

  it('animated={false} strips the animation in either mode', () => {
    render(
      <Tabs defaultValue="a">
        <TabsList aria-label="关动画">
          <TabsTab value="a">A</TabsTab>
        </TabsList>
        <TabsPanel animated={false} value="a">面板</TabsPanel>
      </Tabs>,
    )
    expect(document.querySelector('[data-slot="tabs-panel"]')?.className).not.toContain('data-starting-style:opacity-0')
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
