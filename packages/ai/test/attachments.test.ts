import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { attachmentKindOf, DEFAULT_MAX_ATTACHMENT_BYTES, fileToContentPart, useAttachmentDraft } from '../src/runtime/attachments'

describe('attachments', () => {
  it('classifies mime types', () => {
    expect(attachmentKindOf('image/png')).toBe('image')
    expect(attachmentKindOf('application/pdf')).toBe('document')
    expect(attachmentKindOf('text/markdown')).toBe('document')
    expect(attachmentKindOf('application/zip')).toBeUndefined()
  })

  it('turns a file into a data ContentPart', async () => {
    const part = await fileToContentPart(new File([new Uint8Array([1, 2, 3])], 'a.png', { type: 'image/png' }))
    expect(part).toMatchObject({ type: 'image', source: { type: 'data', mimeType: 'image/png', value: 'AQID' } })
    const md = await fileToContentPart(new File(['# hi'], 'notes.md'))
    expect(md).toMatchObject({ type: 'document', source: { mimeType: 'text/markdown' } })
  })

  it('rejects a file over the limit or of an unsupported type', async () => {
    await expect(fileToContentPart(new File([new Uint8Array(4)], 'big.png', { type: 'image/png' }), { maxBytes: 3 })).rejects.toThrow(/limit/)
    await expect(fileToContentPart(new File(['x'], 'a.zip', { type: 'application/zip' }))).rejects.toThrow(/not an accepted/)
    expect(DEFAULT_MAX_ATTACHMENT_BYTES).toBe(3 * 1024 * 1024)
  })

  it('draft holds files and ready-made parts, flags bad ones, and converts the rest to parts', async () => {
    const { result } = renderHook(() => useAttachmentDraft({ maxBytes: 8 }))
    act(() => result.current.add([
      new File([new Uint8Array([1])], 'a.png', { type: 'image/png' }),
      { type: 'audio', source: { type: 'data', mimeType: 'audio/webm', value: 'AA==' } },
      new File([new Uint8Array(9)], 'big.png', { type: 'image/png' }),
      new File(['x'], 'a.zip', { type: 'application/zip' }),
    ]))
    expect(result.current.items.map(i => [i.kind, i.state])).toEqual([['image', 'idle'], ['audio', 'done'], ['image', 'error'], ['document', 'error']])
    expect(result.current.items[2]?.error).toBe('too-large')
    expect(result.current.items[3]?.error).toBe('unsupported')
    const parts = await result.current.toParts()
    expect(parts.map(p => p.type)).toEqual(['image', 'audio'])
    act(() => result.current.remove(result.current.items[0].id))
    expect(result.current.items).toHaveLength(3)
    act(() => result.current.clear())
    expect(result.current.items).toHaveLength(0)
    expect(result.current.accept).toContain('image/*')
    expect(result.current.accept).toContain('application/pdf')
  })

  it('applies `accept` to ready-made parts, not only to picked files', () => {
    // The recorder hands in an AudioPart directly. It used to land as `done`
    // under an image-only composer while the identical audio *file* was refused.
    const { result } = renderHook(() => useAttachmentDraft({ accept: ['image'] }))
    act(() => result.current.add([
      { type: 'audio', source: { type: 'data', mimeType: 'audio/webm', value: 'AA==' } },
      { type: 'image', source: { type: 'data', mimeType: 'image/png', value: 'AA==' } },
      new File([new Uint8Array([1])], 'a.webm', { type: 'audio/webm' }),
    ]))
    expect(result.current.items.map(i => [i.kind, i.state])).toEqual([['audio', 'error'], ['image', 'done'], ['audio', 'error']])
    expect(result.current.items[0]?.error).toBe('unsupported')
  })
})
