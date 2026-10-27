import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DataPagination } from '../src/components/data-pagination'

// The page buttons as rendered: numbers, `…` for an ellipsis, `[n]` for the current page.
function pages(): string {
  return [...document.querySelectorAll('[data-slot=pagination-link], [data-slot=pagination-ellipsis]')]
    .map(slot => slot.matches('[data-slot=pagination-ellipsis]')
      ? '…'
      : slot.getAttribute('aria-current') === 'page' ? `[${slot.textContent}]` : slot.textContent)
    .join(' ')
}

describe('dataPagination', () => {
  it('pages uncontrolled through the nav buttons', async () => {
    const onPageChange = vi.fn()
    render(<DataPagination onPageChange={onPageChange} total={100} />)
    expect(pages()).toBe('[1] 2 3 4 5')
    await userEvent.click(screen.getByRole('button', { name: 'Next page' }))
    expect(onPageChange).toHaveBeenCalledWith(2, expect.objectContaining({ reason: 'item-press' }))
    expect(pages()).toBe('1 [2] 3 4 5')
  })

  it('jumps straight to a pressed page, and the current one again is no change', async () => {
    const onPageChange = vi.fn()
    render(<DataPagination onPageChange={onPageChange} total={100} />)
    await userEvent.click(screen.getByRole('button', { name: '4' }))
    expect(onPageChange).toHaveBeenCalledWith(4, expect.objectContaining({ reason: 'item-press' }))
    expect(pages()).toBe('1 2 3 [4] 5')
    await userEvent.click(screen.getByRole('button', { name: '4' }))
    expect(onPageChange).toHaveBeenCalledTimes(1)
  })

  // Seven slots once there are more than seven pages, so the row never
  // changes width as the page moves.
  it.each([
    [1, '[1] 2 3 4 5 … 13'],
    [4, '1 2 3 [4] 5 … 13'],
    [5, '1 … 4 [5] 6 … 13'],
    [9, '1 … 8 [9] 10 … 13'],
    [10, '1 … 9 [10] 11 12 13'],
    [13, '1 … 9 10 11 12 [13]'],
  ])('windows 13 pages around page %i', (page, expected) => {
    render(<DataPagination limit={10} page={page} total={130} />)
    expect(pages()).toBe(expected)
  })

  it('disables backward controls on the first page and forward on the last', async () => {
    render(<DataPagination defaultPage={5} total={100} />)
    expect(screen.getByRole('button', { name: 'Next page' }).matches('[disabled], [aria-disabled=true]')).toBe(true)
    await userEvent.click(screen.getByRole('button', { name: '1' }))
    expect(screen.getByRole('button', { name: 'Previous page' }).matches('[disabled], [aria-disabled=true]')).toBe(true)
  })

  it('keeps a controlled page pinned to the prop while still reporting the change', async () => {
    const onPageChange = vi.fn()
    render(<DataPagination onPageChange={onPageChange} page={3} total={100} />)
    await userEvent.click(screen.getByRole('button', { name: 'Next page' }))
    expect(onPageChange).toHaveBeenCalledWith(4, expect.objectContaining({ reason: 'item-press' }))
    expect(pages()).toBe('1 2 [3] 4 5')
  })

  it('clamps an overshooting page when total shrinks, but never on total=0', () => {
    const onPageChange = vi.fn()
    const { rerender } = render(
      <DataPagination defaultPage={5} onPageChange={onPageChange} total={100} />,
    )
    // Mid-flight refetch: react-query drops data, total reads 0 — do not clamp.
    rerender(<DataPagination defaultPage={5} onPageChange={onPageChange} total={0} />)
    expect(onPageChange).not.toHaveBeenCalled()
    rerender(<DataPagination defaultPage={5} onPageChange={onPageChange} total={40} />)
    // The clamp is not a press: the page vanished, same semantics as Base UI's
    // Tabs falling back when the selected tab is gone — reason 'missing'.
    expect(onPageChange).toHaveBeenCalledWith(2, expect.objectContaining({ reason: 'missing' }))
  })

  it('guards against limit=0 instead of dividing into Infinity', () => {
    render(<DataPagination limit={0} total={100} />)
    expect(pages()).toBe('[1]')
  })

  it('renders summary and custom page indicator from the state', () => {
    render(
      <DataPagination
        defaultPage={2}
        pageIndicator={({ page, totalPages }) => `第 ${page} 页,共 ${totalPages} 页`}
        summary={({ total }) => `共 ${total} 条`}
        total={100}
      />,
    )
    expect(screen.getByText('共 100 条')).not.toBeNull()
    expect(screen.getByText('第 2 页,共 5 页')).not.toBeNull()
  })

  it('reports a limit change from the rows-per-page select', async () => {
    const onLimitChange = vi.fn()
    render(<DataPagination onLimitChange={onLimitChange} total={100} />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('combobox', { name: /Rows per page/ }))
    await user.click(await screen.findByRole('option', { name: '50' }))
    expect(onLimitChange).toHaveBeenCalledWith(50, expect.objectContaining({ reason: 'item-press' }))
  })
})
