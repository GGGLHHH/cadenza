import type { ReactElement } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { createThreadIndex } from '../src/runtime/threads'
import { ThreadList, ThreadListDelete, ThreadListGroup, ThreadListGroupLabel, ThreadListItem, ThreadListNew, ThreadListRename } from '../src/view/thread-list'

function setup() {
  const index = createThreadIndex({ storage: 'memory' })
  // Explicit timestamps: the index sorts newest first, and two `create` calls
  // can straddle a millisecond — the tests below index rows by position.
  index.create({ id: 'a', title: 'Alpha', updatedAt: 2 })
  index.create({ id: 'b', title: 'Beta', updatedAt: 1 })
  const onValueChange = vi.fn()
  const ui = (): ReactElement => (
    <ThreadList index={index} threads={index.list()} value="a" onValueChange={onValueChange}>
      <ThreadListNew>New</ThreadListNew>
      <ThreadListGroup>
        <ThreadListGroupLabel>Today</ThreadListGroupLabel>
        {index.list().map(t => (
          <ThreadListItem key={t.id} thread={t}>
            <ThreadListRename aria-label="Rename" />
            <ThreadListDelete aria-label="Delete" />
          </ThreadListItem>
        ))}
      </ThreadListGroup>
    </ThreadList>
  )
  return { index, onValueChange, ...render(ui()), ui }
}

describe('threadList', () => {
  it('marks the active row and selects on press', async () => {
    const { onValueChange } = setup()
    const rows = screen.getAllByRole('listitem')
    expect(rows[0].hasAttribute('data-active')).toBe(true)
    expect(rows[0].getAttribute('aria-current')).toBe('page')
    await userEvent.click(screen.getByText('Beta'))
    expect(onValueChange).toHaveBeenCalledWith('b', expect.objectContaining({ reason: 'item-press' }))
  })
  it('renames inline: Enter commits, Escape cancels', async () => {
    const { index, rerender, ui } = setup()
    await userEvent.click(screen.getAllByLabelText('Rename')[0])
    const input = screen.getByDisplayValue('Alpha')
    await userEvent.clear(input)
    await userEvent.type(input, 'Gamma{Enter}')
    expect(index.get('a')?.title).toBe('Gamma')
    rerender(ui())
    await userEvent.click(screen.getAllByLabelText('Rename')[0])
    await userEvent.type(screen.getByDisplayValue('Gamma'), 'X{Escape}')
    expect(index.get('a')?.title).toBe('Gamma')
  })
  it('deletes through the index and creates through New', async () => {
    const { index, onValueChange } = setup()
    await userEvent.click(screen.getAllByLabelText('Delete')[1])
    expect(index.get('b')).toBeUndefined()
    await userEvent.click(screen.getByText('New'))
    expect(index.list()).toHaveLength(2)
    expect(onValueChange).toHaveBeenLastCalledWith(expect.any(String), expect.objectContaining({ reason: 'item-press' }))
  })
})

describe('threadList untitled', () => {
  it('shows the untitled label only while a thread has no title', () => {
    const index = createThreadIndex({ key: 'untitled', storage: 'memory' })
    const named = index.create({ title: 'Named' })
    const blank = index.create()
    render(
      <ThreadList index={index} threads={index.list()} untitled="New chat" value={named.id} onValueChange={() => {}} />,
    )
    expect(screen.getByText('Named')).toBeTruthy()
    expect(screen.getByText('New chat')).toBeTruthy()
    expect(document.querySelectorAll('[data-slot=thread-list-item]')).toHaveLength(2)
    expect(blank.title).toBe('')
  })
})
