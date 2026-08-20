import type { ThemeEditorOpenChangeEventDetails } from '../src/components/theme-editor'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ThemeEditor } from '../src/components/theme-editor'

// jsdom 有完整的 CSSOM:把主题 token 以真实 <style> 挂进 head,
// readStylesheetDefaults 就能像在浏览器里一样读到默认值
const THEME_CSS = `
:root { --radius: 0.5rem; --primary: #112233; --accent: #a1b2c3; }
.dark, [data-theme='dark'] { --primary: #445566; --accent: #d4e5f6; }
`
let themeStyle: HTMLStyleElement

const GROUPS = [{ label: 'Base', tokens: ['--primary', '--accent'] }]

// 这套 vitest 的 jsdom 没有 localStorage(window.localStorage 是 undefined,
// 组件靠 try/catch 安全降级)——持久化测试用内存 stub 顶上
function createMemoryStorage(): Storage {
  const map = new Map<string, string>()
  return {
    get length() {
      return map.size
    },
    clear: () => map.clear(),
    getItem: key => map.get(key) ?? null,
    key: index => [...map.keys()][index] ?? null,
    removeItem: (key) => {
      map.delete(key)
    },
    setItem: (key, value) => {
      map.set(key, String(value))
    },
  }
}

beforeEach(() => {
  vi.stubGlobal('localStorage', createMemoryStorage())
  themeStyle = document.createElement('style')
  themeStyle.textContent = THEME_CSS
  document.head.append(themeStyle)
})

afterEach(() => {
  themeStyle.remove()
  document.documentElement.classList.remove('dark')
  vi.unstubAllGlobals()
})

function primaryInput(): HTMLInputElement {
  return screen.getByRole('textbox', { name: '--primary value' })
}

describe('themeEditor', () => {
  it('renders a floating trigger with the English default name, panel closed', () => {
    render(<ThemeEditor groups={GROUPS} storageKey={null} />)
    const trigger = screen.getByRole('button', { name: 'Theme editor' })
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('opens the panel and shows token rows filled from the stylesheet', async () => {
    const user = userEvent.setup()
    render(<ThemeEditor groups={GROUPS} storageKey={null} />)
    await user.click(screen.getByRole('button', { name: 'Theme editor' }))
    expect(screen.getByRole('dialog', { name: 'Theme editor' })).not.toBeNull()
    await waitFor(() => expect(primaryInput().value).toBe('#112233'))
  })

  it('follows the html dark markers for which set is edited', async () => {
    document.documentElement.classList.add('dark')
    render(<ThemeEditor defaultOpen groups={GROUPS} storageKey={null} />)
    await waitFor(() => expect(primaryInput().value).toBe('#445566'))
    expect(screen.getByText('Editing dark')).not.toBeNull()
  })

  it('injects edits document-wide with a guarded light arm', async () => {
    render(<ThemeEditor defaultOpen groups={GROUPS} storageKey={null} />)
    await waitFor(() => expect(primaryInput().value).toBe('#112233'))
    // user.clear 会触发「清空=撤销覆盖」回落默认值,后续键入变成追加——
    // 一次 change 事件才是「设为新值」
    fireEvent.change(primaryInput(), { target: { value: 'red' } })
    const injected = [...document.querySelectorAll('style')]
      .find(style => style.textContent?.includes(':root:not(.dark)'))
    expect(injected?.textContent).toContain('--primary: red;')
  })

  it('undo, redo and reset walk the history, reset itself undoable', async () => {
    const user = userEvent.setup()
    render(<ThemeEditor defaultOpen groups={GROUPS} storageKey={null} />)
    await waitFor(() => expect(primaryInput().value).toBe('#112233'))
    const undo = screen.getByRole('button', { name: 'Undo' })
    const redo = screen.getByRole('button', { name: 'Redo' })
    expect((undo as HTMLButtonElement).disabled).toBe(true)

    fireEvent.change(primaryInput(), { target: { value: 'rebecca' } })
    fireEvent.change(primaryInput(), { target: { value: 'rebeccapurple' } })
    expect((undo as HTMLButtonElement).disabled).toBe(false)

    // 同 token 的连续键入合并成一步:一次撤回整段退掉
    await user.click(undo)
    expect(primaryInput().value).toBe('#112233')
    await user.click(redo)
    expect(primaryInput().value).toBe('rebeccapurple')

    await user.click(screen.getByRole('button', { name: 'Reset' }))
    expect(primaryInput().value).toBe('#112233')
    await user.click(undo)
    expect(primaryInput().value).toBe('rebeccapurple')
  })

  it('persists edits under storageKey and restores them on the next mount', async () => {
    const first = render(<ThemeEditor defaultOpen groups={GROUPS} storageKey="test-theme" />)
    await waitFor(() => expect(primaryInput().value).toBe('#112233'))
    fireEvent.change(primaryInput(), { target: { value: 'teal' } })
    await waitFor(() => {
      expect(localStorage.getItem('test-theme')).toContain('teal')
    })
    first.unmount()

    render(<ThemeEditor defaultOpen groups={GROUPS} storageKey="test-theme" />)
    await waitFor(() => expect(primaryInput().value).toBe('teal'))
  })

  it('storageKey null turns persistence off entirely', async () => {
    render(<ThemeEditor defaultOpen groups={GROUPS} storageKey={null} />)
    await waitFor(() => expect(primaryInput().value).toBe('#112233'))
    fireEvent.change(primaryInput(), { target: { value: 'teal' } })
    expect(localStorage.length).toBe(0)
  })

  it('export downloads both full sets as a CSS file', async () => {
    const user = userEvent.setup()
    // jsdom 没有 createObjectURL(类型上存在、运行时缺);打桩捕获 Blob
    let exported: Blob | null = null
    // 静态方法无 this 依赖,摘下来只为测试后原样放回
    // eslint-disable-next-line ts/unbound-method
    const originalCreate = URL.createObjectURL
    // eslint-disable-next-line ts/unbound-method
    const originalRevoke = URL.revokeObjectURL
    URL.createObjectURL = (blob) => {
      exported = blob as Blob
      return 'blob:mock'
    }
    URL.revokeObjectURL = () => {}
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {})
    try {
      render(
        <ThemeEditor
          defaultOpen
          exportFileName="my-theme.css"
          groups={GROUPS}
          storageKey={null}
        />,
      )
      await waitFor(() => expect(primaryInput().value).toBe('#112233'))
      fireEvent.change(primaryInput(), { target: { value: 'teal' } })
      await user.click(screen.getByRole('button', { name: 'Export CSS' }))
      expect(clickSpy).toHaveBeenCalled()
      const text = await (exported as Blob | null)?.text()
      expect(text).toContain(':root {')
      expect(text).toContain('--primary: teal;')
      expect(text).toContain('.dark,')
    }
    finally {
      clickSpy.mockRestore()
      URL.createObjectURL = originalCreate
      URL.revokeObjectURL = originalRevoke
    }
  })

  it('import merges pasted CSS into the right sets', async () => {
    const user = userEvent.setup()
    render(<ThemeEditor defaultOpen groups={GROUPS} storageKey={null} />)
    await waitFor(() => expect(primaryInput().value).toBe('#112233'))
    await user.click(screen.getByRole('button', { name: 'Import' }))
    await user.click(screen.getByRole('textbox', { name: 'Import' }))
    await user.paste(':root { --primary: hotpink; --radius: 1rem; }')
    await user.click(screen.getByRole('button', { name: 'Apply' }))
    await waitFor(() => expect(primaryInput().value).toBe('hotpink'))
  })

  it('the empty-import error uses the label prop', async () => {
    const user = userEvent.setup()
    render(
      <ThemeEditor
        defaultOpen
        groups={GROUPS}
        importErrorLabel="没有可用的 token"
        storageKey={null}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Import' }))
    await user.click(screen.getByRole('button', { name: 'Apply' }))
    expect(screen.getByText('没有可用的 token')).not.toBeNull()
  })

  it('is open-controllable and cancel() vetoes the change', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn((_: boolean, details: ThemeEditorOpenChangeEventDetails) =>
      details.cancel())
    render(
      <ThemeEditor groups={GROUPS} open={false} storageKey={null} onOpenChange={onOpenChange} />,
    )
    await user.click(screen.getByRole('button', { name: 'Theme editor' }))
    expect(onOpenChange).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ reason: 'trigger-press' }),
    )
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('escape closes the panel with its own reason', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    render(
      <ThemeEditor defaultOpen groups={GROUPS} storageKey={null} onOpenChange={onOpenChange} />,
    )
    await waitFor(() => expect(primaryInput().value).toBe('#112233'))
    await user.click(primaryInput())
    await user.keyboard('{Escape}')
    expect(onOpenChange).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ reason: 'escape-key' }),
    )
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('speaks whatever language the label props hand it', async () => {
    const user = userEvent.setup()
    render(
      <ThemeEditor
        aria-label="主题编辑器"
        groups={[{ label: '基础', tokens: ['--primary'] }]}
        resetLabel="重置"
        storageKey={null}
        titleLabel="主题编辑器"
      />,
    )
    await user.click(screen.getByRole('button', { name: '主题编辑器' }))
    expect(screen.getByRole('dialog', { name: '主题编辑器' })).not.toBeNull()
    expect(screen.getByRole('button', { name: '重置' })).not.toBeNull()
    expect(screen.getByText('基础')).not.toBeNull()
  })
})
