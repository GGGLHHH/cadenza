import type { ComposerProps } from '../src/view/composer'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Composer, ComposerSubmit, ComposerTextarea, ComposerToolbar } from '../src/view/composer'
import { Suggestions, SuggestionsItem } from '../src/view/suggestions'

function setup(props: Partial<React.ComponentProps<typeof Composer>> = {}) {
  const onValueCommitted = vi.fn<ComposerProps['onValueCommitted']>()
  const onStop = vi.fn<NonNullable<ComposerProps['onStop']>>()
  const onFiles = vi.fn<NonNullable<ComposerProps['onFiles']>>()
  const onEditCancel = vi.fn<NonNullable<ComposerProps['onEditCancel']>>()
  const utils = render(
    <Composer status="ready" onValueCommitted={onValueCommitted} onStop={onStop} onFiles={onFiles} onEditCancel={onEditCancel} {...props}>
      <ComposerTextarea placeholder="Say something" />
      <ComposerToolbar><ComposerSubmit aria-label="Send" /></ComposerToolbar>
    </Composer>,
  )
  return { ...utils, onValueCommitted, onStop, onFiles, onEditCancel, textarea: screen.getByPlaceholderText<HTMLTextAreaElement>('Say something') }
}

describe('composer', () => {
  it('submits on Enter with a keyboard reason, inserts a newline on Shift+Enter, ignores composing', async () => {
    const { textarea, onValueCommitted } = setup()
    await userEvent.type(textarea, 'hello')
    await userEvent.keyboard('{Shift>}{Enter}{/Shift}')
    expect(onValueCommitted).not.toHaveBeenCalled()
    expect(textarea.value).toBe('hello\n')
    textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, isComposing: true }))
    expect(onValueCommitted).not.toHaveBeenCalled()
    await userEvent.keyboard('{Enter}')
    expect(onValueCommitted).toHaveBeenCalledTimes(1)
    expect(onValueCommitted.mock.calls[0][0]).toBe('hello\n')
    expect(onValueCommitted.mock.calls[0][1].reason).toBe('keyboard')
  })

  it('renders a stop control while streaming and calls onStop; Escape stops too', async () => {
    const { onStop, textarea } = setup({ status: 'streaming' })
    const form = textarea.closest('form')!
    expect(form.hasAttribute('data-streaming')).toBe(true)
    await userEvent.click(screen.getByLabelText('Send'))
    expect(onStop).toHaveBeenCalledTimes(1)
    textarea.focus()
    await userEvent.keyboard('{Escape}')
    expect(onStop).toHaveBeenCalledTimes(2)
  })

  it('escape cancels the edit instead of stopping while editing', async () => {
    const { onEditCancel, onStop, textarea } = setup({ editing: true })
    expect(textarea.closest('form')?.hasAttribute('data-editing')).toBe(true)
    textarea.focus()
    await userEvent.keyboard('{Escape}')
    expect(onEditCancel).toHaveBeenCalledTimes(1)
    expect(onStop).not.toHaveBeenCalled()
  })

  it('hands dropped and pasted files to onFiles with the reason', async () => {
    const { onFiles, textarea } = setup()
    const file = new File(['x'], 'a.png', { type: 'image/png' })
    const form = textarea.closest('form')!
    form.dispatchEvent(Object.assign(new Event('drop', { bubbles: true }), { dataTransfer: { files: [file], types: ['Files'] } }))
    expect(onFiles.mock.calls[0][1].reason).toBe('drag')
    // user-event pastes into the active element; a paste lands on the textarea only once it has focus.
    textarea.focus()
    await userEvent.paste({ files: [file], getData: () => '' } as never)
    expect(onFiles).toHaveBeenCalledTimes(2)
    expect(onFiles.mock.calls[1][1].reason).toBe('input-paste')
  })

  it('disables submit on empty input', () => {
    setup()
    expect(screen.getByLabelText<HTMLButtonElement>('Send').disabled).toBe(true)
  })
})

describe('suggestions', () => {
  it('routes the pressed value through the root callback', async () => {
    const onValueChange = vi.fn()
    render(<Suggestions onValueChange={onValueChange}><SuggestionsItem value="Plan a rehearsal">Plan a rehearsal</SuggestionsItem></Suggestions>)
    await userEvent.click(screen.getByText('Plan a rehearsal'))
    expect(onValueChange).toHaveBeenCalledWith('Plan a rehearsal', expect.objectContaining({ reason: 'item-press' }))
  })
})
