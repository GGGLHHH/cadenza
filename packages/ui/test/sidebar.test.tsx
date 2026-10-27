import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it } from 'vitest'
import { Sidebar, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, TooltipProvider } from '../src'

// The published entry wires the provider, panel and trigger together (jsdom is
// 1024px wide, so the desktop panel renders, not the mobile sheet).
it('toggles the panel from the trigger and from ⌘B', () => {
  const { container } = render(
    <SidebarProvider>
      <Sidebar collapsible="icon">导航</Sidebar>
      <SidebarInset><SidebarTrigger /></SidebarInset>
    </SidebarProvider>,
  )
  const panel = container.querySelector('[data-slot=sidebar]')!
  expect(panel.getAttribute('data-state')).toBe('expanded')
  fireEvent.click(screen.getByRole('button', { name: 'Toggle Sidebar' }))
  expect(panel.getAttribute('data-state')).toBe('collapsed')
  expect(panel.getAttribute('data-collapsible')).toBe('icon')
  fireEvent.keyDown(window, { key: 'b', metaKey: true })
  expect(panel.getAttribute('data-state')).toBe('expanded')
})

// One surface, the active button's background: it rests there, follows the
// hover, and comes back once the pointer leaves (after the 100ms leave delay).
it('keeps one highlight that rests on the active button and follows the hover', async () => {
  const user = userEvent.setup()
  render(
    <SidebarProvider>
      <Sidebar collapsible="none">
        <SidebarMenu>
          <SidebarMenuItem><SidebarMenuButton isActive>首页</SidebarMenuButton></SidebarMenuItem>
          <SidebarMenuItem><SidebarMenuButton>收件箱</SidebarMenuButton></SidebarMenuItem>
        </SidebarMenu>
      </Sidebar>
    </SidebarProvider>,
  )
  // A surface handed off stays mounted, at opacity 0, until its exit settles.
  const lit = (): (string | null)[] => [...document.querySelectorAll<HTMLElement>('[data-slot=sidebar-menu-highlight]')]
    .filter(surface => surface.style.opacity !== '0')
    .map(surface => surface.parentElement!.textContent)
  expect(lit()).toEqual(['首页'])
  await user.hover(screen.getByRole('button', { name: '收件箱' }))
  await waitFor(() => expect(lit()).toEqual(['收件箱']))
  await user.unhover(screen.getByRole('button', { name: '收件箱' }))
  await waitFor(() => expect(lit()).toEqual(['首页']))
})

// Expanded, a tooltip stays disabled — unless the object form says
// `hidden: false`, as the vendored spread order allowed (shadcn's sidebar-09).
it('shows an expanded tooltip only when the object form unhides it', async () => {
  const user = userEvent.setup()
  render(
    <TooltipProvider>
      <SidebarProvider>
        <Sidebar collapsible="none">
          <SidebarMenu>
            <SidebarMenuItem><SidebarMenuButton tooltip="首页提示">首页</SidebarMenuButton></SidebarMenuItem>
            <SidebarMenuItem><SidebarMenuButton tooltip={{ children: '收件箱提示', hidden: false }}>收件箱</SidebarMenuButton></SidebarMenuItem>
          </SidebarMenu>
        </Sidebar>
      </SidebarProvider>
    </TooltipProvider>,
  )
  await user.hover(screen.getByRole('button', { name: '收件箱' }))
  expect(await screen.findByText('收件箱提示')).toBeTruthy()
  await user.hover(screen.getByRole('button', { name: '首页' }))
  await new Promise(resolve => setTimeout(resolve, 50))
  expect(screen.queryByText('首页提示')).toBeNull()
})
