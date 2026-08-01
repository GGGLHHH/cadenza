import { describe, expect, it, vi } from 'vitest'
import { resolveRenderChildren } from '../src/resolve-render-children'

describe('resolveRenderChildren', () => {
  it('returns node children as-is, ignoring defaultChildren', () => {
    expect(resolveRenderChildren('内容', {}, '默认')).toBe('内容')
  })

  it('backfills nullish node children with defaultChildren', () => {
    expect(resolveRenderChildren(undefined, {}, '默认')).toBe('默认')
    expect(resolveRenderChildren(null, {}, '默认')).toBe('默认')
  })

  it('calls function children with the values plus defaultChildren', () => {
    const children = vi.fn(() => '结果')
    const result = resolveRenderChildren(children, { isEmpty: true }, '默认')
    expect(result).toBe('结果')
    expect(children).toHaveBeenCalledExactlyOnceWith({ isEmpty: true, defaultChildren: '默认' })
  })

  it('falls back to defaultChildren when the function returns null — RAC parity', () => {
    // RAC's useRenderProps ends with `computedChildren ?? defaultChildren`,
    // which applies to the function branch too (utils.tsx). Pinned against
    // the real source, not intuition — "render nothing" is expressed by
    // having no defaultChildren, not by returning null over one.
    expect(resolveRenderChildren(() => null, {}, '默认')).toBe('默认')
    expect(resolveRenderChildren(() => '结果', {}, '默认')).toBe('结果')
  })
})
