'use client'
import type { ContentPart } from '@tanstack/ai/client'
import { useCallback, useMemo, useRef, useState } from 'react'

/** 3 MiB: base64 in a JSON body, comfortably under common function payload limits. */
export const DEFAULT_MAX_ATTACHMENT_BYTES = 3 * 1024 * 1024

export type AttachmentKind = 'image' | 'audio' | 'video' | 'document'
export type AttachmentState = 'idle' | 'uploading' | 'done' | 'error'

const DOCUMENT_MIMES = new Set(['application/pdf', 'text/plain', 'text/markdown'])
const EXTENSION_MIME: Record<string, string> = { pdf: 'application/pdf', md: 'text/markdown', txt: 'text/plain' }

export function attachmentKindOf(mimeType: string): AttachmentKind | undefined {
  if (mimeType.startsWith('image/'))
    return 'image'
  if (mimeType.startsWith('audio/'))
    return 'audio'
  if (mimeType.startsWith('video/'))
    return 'video'
  if (DOCUMENT_MIMES.has(mimeType))
    return 'document'
  return undefined
}

function mimeOf(file: File): string {
  if (file.type !== '')
    return file.type
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  return EXTENSION_MIME[ext] ?? ''
}

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error ?? new Error('cadenza-ai: could not read the file'))
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '')
    reader.readAsDataURL(file)
  })
}

/** Inline a file as a `data` content part; rejects unsupported types and oversize files. */
export async function fileToContentPart(file: File, options: { maxBytes?: number } = {}): Promise<ContentPart> {
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_ATTACHMENT_BYTES
  if (file.size > maxBytes)
    throw new Error(`cadenza-ai: "${file.name}" exceeds the ${maxBytes} byte attachment limit.`)
  const mimeType = mimeOf(file)
  const kind = attachmentKindOf(mimeType)
  if (!kind)
    throw new Error(`cadenza-ai: "${file.name}" (${mimeType || 'unknown type'}) is not an accepted attachment.`)
  const value = await toBase64(file)
  return { type: kind, source: { type: 'data', value, mimeType } }
}

export interface DraftAttachment {
  id: string
  kind: AttachmentKind
  state: AttachmentState
  name: string
  mimeType: string
  size: number
  /** Present for files picked in the browser; converted on `toParts()`. */
  file?: File
  /** Present for parts handed in ready-made (dictation, pasted URLs). */
  part?: ContentPart
  error?: string
  /** Object URL for image thumbnails; revoked on remove / clear. */
  previewUrl?: string
}

export interface UseAttachmentDraftOptions {
  maxBytes?: number
  /** Kinds the picker accepts. Default: all four. */
  accept?: readonly AttachmentKind[]
}

export interface AttachmentDraft {
  items: readonly DraftAttachment[]
  add: (items: ReadonlyArray<File | ContentPart>) => void
  remove: (id: string) => void
  clear: () => void
  /** Convert every item to content parts, in order; rejects if any file fails. */
  toParts: () => Promise<ContentPart[]>
  /** `accept` attribute for `<input type="file">`. */
  accept: string
}

const ACCEPT: Record<AttachmentKind, string[]> = {
  image: ['image/*'],
  audio: ['audio/*'],
  video: ['video/*'],
  document: ['application/pdf', 'text/plain', 'text/markdown'],
}

let counter = 0
function nextId(): string {
  counter += 1
  return `attachment-${Date.now().toString(36)}-${counter}`
}

function revoke(item: DraftAttachment): void {
  if (item.previewUrl !== undefined)
    URL.revokeObjectURL(item.previewUrl)
}

/** The composer's pending attachments, before they become parts of a sent message. */
const ALL_KINDS: readonly AttachmentKind[] = ['image', 'audio', 'video', 'document']

export function useAttachmentDraft(options: UseAttachmentDraftOptions = {}): AttachmentDraft {
  const accepted = options.accept
  const kinds = useMemo(() => accepted ?? ALL_KINDS, [accepted])
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_ATTACHMENT_BYTES
  const [items, setItems] = useState<readonly DraftAttachment[]>([])
  const itemsRef = useRef(items)
  itemsRef.current = items

  const add = useCallback((incoming: ReadonlyArray<File | ContentPart>): void => {
    const next: DraftAttachment[] = incoming.map((entry) => {
      if (entry instanceof File) {
        const mimeType = mimeOf(entry)
        const kind = attachmentKindOf(mimeType)
        const base = { id: nextId(), name: entry.name, mimeType, size: entry.size, file: entry }
        if (!kind || !kinds.includes(kind))
          return { ...base, kind: kind ?? 'document', state: 'error', error: 'unsupported' }
        if (entry.size > maxBytes)
          return { ...base, kind, state: 'error', error: 'too-large' }
        return { ...base, kind, state: 'idle', previewUrl: kind === 'image' ? URL.createObjectURL(entry) : undefined }
      }
      const kind = entry.type === 'text' ? undefined : entry.type
      const mimeType = entry.type === 'text' ? 'text/plain' : entry.source.mimeType ?? ''
      return { id: nextId(), kind: kind ?? 'document', state: kind ? 'done' : 'error', name: kind ?? 'text', mimeType, size: 0, part: entry, ...(kind ? {} : { error: 'unsupported' }) }
    })
    setItems(current => [...current, ...next])
  }, [kinds, maxBytes])

  const remove = useCallback((id: string): void => {
    setItems((current) => {
      current.filter(i => i.id === id).forEach(revoke)
      return current.filter(i => i.id !== id)
    })
  }, [])

  const clear = useCallback((): void => {
    setItems((current) => {
      current.forEach(revoke)
      return []
    })
  }, [])

  const toParts = useCallback(async (): Promise<ContentPart[]> => {
    return Promise.all(itemsRef.current
      .filter(i => i.state !== 'error')
      .map(i => (i.part ? Promise.resolve(i.part) : fileToContentPart(i.file!, { maxBytes }))))
  }, [maxBytes])

  const accept = useMemo(() => kinds.flatMap(k => ACCEPT[k]).join(','), [kinds])

  return useMemo(() => ({ items, add, remove, clear, toParts, accept }), [items, add, remove, clear, toParts, accept])
}
