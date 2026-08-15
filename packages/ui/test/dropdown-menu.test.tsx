import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuGroup,
  DropdownMenuGroupLabel,
  DropdownMenuItem,
  DropdownMenuPopup,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuShortcut,
  DropdownMenuSubmenu,
  DropdownMenuSubmenuPopup,
  DropdownMenuSubmenuTrigger,
  DropdownMenuTrigger,
} from '../src/components/dropdown-menu'

it('opens from the trigger, fires the item action and closes', async () => {
  const user = userEvent.setup()
  const onRename = vi.fn()
  render(
    <DropdownMenu>
      <DropdownMenuTrigger>操作</DropdownMenuTrigger>
      <DropdownMenuPopup>
        <DropdownMenuItem onClick={onRename}>重命名</DropdownMenuItem>
      </DropdownMenuPopup>
    </DropdownMenu>,
  )

  await user.click(screen.getByRole('button', { name: '操作' }))
  await user.click(await screen.findByRole('menuitem', { name: '重命名' }))
  expect(onRename).toHaveBeenCalledOnce()
  expect(screen.queryByRole('menuitem')).toBeNull()
})

it('checkbox item toggles in place without closing the menu', async () => {
  const user = userEvent.setup()
  const onCheckedChange = vi.fn()
  render(
    <DropdownMenu>
      <DropdownMenuTrigger>视图</DropdownMenuTrigger>
      <DropdownMenuPopup>
        <DropdownMenuCheckboxItem defaultChecked onCheckedChange={onCheckedChange}>
          显示行号
        </DropdownMenuCheckboxItem>
      </DropdownMenuPopup>
    </DropdownMenu>,
  )

  await user.click(screen.getByRole('button', { name: '视图' }))
  const item = await screen.findByRole('menuitemcheckbox', { name: '显示行号' })
  expect(item.getAttribute('aria-checked')).toBe('true')
  await user.click(item)
  expect(onCheckedChange).toHaveBeenCalledWith(false, expect.anything())
  // Still open, now unchecked — a settings menu survives its own toggles.
  expect(screen.getByRole('menuitemcheckbox', { name: '显示行号' }).getAttribute('aria-checked')).toBe('false')
})

it('radio group moves the single choice between radio items', async () => {
  const user = userEvent.setup()
  const onValueChange = vi.fn()
  render(
    <DropdownMenu>
      <DropdownMenuTrigger>排序</DropdownMenuTrigger>
      <DropdownMenuPopup>
        <DropdownMenuRadioGroup defaultValue="name" onValueChange={onValueChange}>
          <DropdownMenuRadioItem value="name">按名称</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="date">按日期</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuPopup>
    </DropdownMenu>,
  )

  await user.click(screen.getByRole('button', { name: '排序' }))
  expect((await screen.findByRole('menuitemradio', { name: '按名称' })).getAttribute('aria-checked')).toBe('true')
  await user.click(screen.getByRole('menuitemradio', { name: '按日期' }))
  expect(onValueChange).toHaveBeenCalledWith('date', expect.anything())
})

it('drills into a submenu by keyboard', async () => {
  const user = userEvent.setup()
  render(
    <DropdownMenu>
      <DropdownMenuTrigger>操作</DropdownMenuTrigger>
      <DropdownMenuPopup>
        <DropdownMenuSubmenu>
          <DropdownMenuSubmenuTrigger>导出为</DropdownMenuSubmenuTrigger>
          <DropdownMenuSubmenuPopup>
            <DropdownMenuItem>PDF</DropdownMenuItem>
          </DropdownMenuSubmenuPopup>
        </DropdownMenuSubmenu>
      </DropdownMenuPopup>
    </DropdownMenu>,
  )

  // jsdom pointers race Base UI's hover intent — ArrowRight drilling is the
  // real a11y contract anyway.
  await user.click(screen.getByRole('button', { name: '操作' }))
  await user.keyboard('{ArrowDown}')
  await user.keyboard('{ArrowRight}')
  expect(await screen.findByRole('menuitem', { name: 'PDF' })).toBeDefined()
})

it('keeps the vendored data-slot spelling under the Base UI part names', async () => {
  const user = userEvent.setup()
  render(
    <DropdownMenu>
      <DropdownMenuTrigger>更多</DropdownMenuTrigger>
      <DropdownMenuPopup>
        <DropdownMenuGroup>
          <DropdownMenuGroupLabel>编辑</DropdownMenuGroupLabel>
          <DropdownMenuItem>
            复制
            <DropdownMenuShortcut>⌘C</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuPopup>
    </DropdownMenu>,
  )

  await user.click(screen.getByRole('button', { name: '更多' }))
  await screen.findByRole('menuitem')
  // Renamed parts keep their vendored hooks — the styling contract callers grep for.
  expect(document.querySelector('[data-slot="dropdown-menu-content"]')).not.toBeNull()
  expect(document.querySelector('[data-slot="dropdown-menu-label"]')).not.toBeNull()
  expect(document.querySelector('[data-slot="dropdown-menu-shortcut"]')?.textContent).toBe('⌘C')
})
