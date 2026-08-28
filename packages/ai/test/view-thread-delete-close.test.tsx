import type { ReactElement } from 'react'
import { AlertDialog, AlertDialogClose, AlertDialogPopup, AlertDialogTitle } from '@gedatou/cadenza-ui'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { createThreadIndex } from '../src/runtime/threads'
import { ThreadList, ThreadListDelete, ThreadListItem } from '../src/view/thread-list'

// The docs recipe: the confirm button of an AlertDialog *is* the ThreadListDelete,
// through Base UI's element `render`. Both the caller's onClick and the part's
// own index.remove must run on that one click.
const index = createThreadIndex({ storage: 'memory' })
index.create({ id: 'a', title: 'Alpha' })

function Fixture({ onDelete }: { onDelete: () => void }): ReactElement {
  return (
    <ThreadList index={index} threads={index.list()} value="a" onValueChange={() => {}}>
      <ThreadListItem thread={index.get('a')!}>
        <AlertDialog open>
          <AlertDialogPopup>
            <AlertDialogTitle>Delete?</AlertDialogTitle>
            <AlertDialogClose render={<ThreadListDelete onClick={onDelete} />}>Delete</AlertDialogClose>
          </AlertDialogPopup>
        </AlertDialog>
        <span data-testid="count">{index.list().length}</span>
      </ThreadListItem>
    </ThreadList>
  )
}

describe('threadListDelete as an AlertDialogClose render', () => {
  it('runs the caller onClick and removes the thread', async () => {
    const onDelete = vi.fn()
    render(<Fixture onDelete={onDelete} />)
    await userEvent.click(screen.getByText('Delete'))
    expect(onDelete).toHaveBeenCalledTimes(1)
    expect(index.get('a')).toBeUndefined()
  })
})
