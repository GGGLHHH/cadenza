import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DataPagination } from '../src/components/data-pagination'

describe('dataPagination', () => {
  it('renders the neutral page indicator and pages uncontrolled', async () => {
    const onPageChange = vi.fn()
    render(<DataPagination onPageChange={onPageChange} total={100} />)
    expect(screen.getByText('1 / 5')).not.toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'Next page' }))
    expect(onPageChange).toHaveBeenCalledWith(2, expect.objectContaining({ reason: 'item-press' }))
    expect(screen.getByText('2 / 5')).not.toBeNull()
  })

  it('disables backward controls on the first page and forward on the last', async () => {
    render(<DataPagination defaultPage={5} total={100} />)
    expect(screen.getByRole('button', { name: 'Next page' }).matches('[disabled], [aria-disabled=true]')).toBe(true)
    expect(screen.getByRole('button', { name: 'Last page' }).matches('[disabled], [aria-disabled=true]')).toBe(true)
    await userEvent.click(screen.getByRole('button', { name: 'First page' }))
    expect(screen.getByText('1 / 5')).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Previous page' }).matches('[disabled], [aria-disabled=true]')).toBe(true)
  })

  it('keeps a controlled page pinned to the prop while still reporting the change', async () => {
    const onPageChange = vi.fn()
    render(<DataPagination onPageChange={onPageChange} page={3} total={100} />)
    await userEvent.click(screen.getByRole('button', { name: 'Next page' }))
    expect(onPageChange).toHaveBeenCalledWith(4, expect.objectContaining({ reason: 'item-press' }))
    expect(screen.getByText('3 / 5')).not.toBeNull()
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
    expect(screen.getByText('1 / 1')).not.toBeNull()
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
