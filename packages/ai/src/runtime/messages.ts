import type { ChatClientState, MultimodalContent, UIMessage } from '@tanstack/ai-client'
import type { ThinkingPart } from '@tanstack/ai/client'

/** The message's text parts, joined by blank lines; tool calls and media are skipped. */
export function messageText(message: UIMessage): string {
  return message.parts.filter(p => p.type === 'text').map(p => p.content).join('\n\n')
}

export interface MessagesToMarkdownOptions {
  title?: string
  /** Include thinking parts as block quotes. Default false. */
  includeThinking?: boolean
}

/** A plain Markdown transcript, for copy / download. */
export function messagesToMarkdown(messages: readonly UIMessage[], options: MessagesToMarkdownOptions = {}): string {
  const out: string[] = []
  if (options.title !== undefined)
    out.push(`# ${options.title}`, '')
  for (const message of messages) {
    out.push(`**${message.role === 'user' ? 'User' : 'Assistant'}**`, '')
    for (const part of message.parts) {
      if (part.type === 'text')
        out.push(part.content, '')
      else if (part.type === 'thinking' && options.includeThinking)
        out.push(...part.content.split('\n').map(line => `> ${line}`), '')
    }
  }
  return `${out.join('\n').trimEnd()}\n`
}

/** The slice of `useChat()` that `editAndResend` needs. */
export interface EditableChat {
  messages: readonly UIMessage[]
  setMessages: (messages: UIMessage[]) => void
  sendMessage: (content: string | MultimodalContent) => Promise<void>
  status: ChatClientState
  stop: () => void
}

/**
 * Linear edit-and-resend (spec Q2): stop any run, drop the edited user message
 * and everything after it, then send the new content in its place.
 */
export async function editAndResend(chat: EditableChat, messageId: string, content: string | MultimodalContent): Promise<void> {
  const index = chat.messages.findIndex(m => m.id === messageId)
  if (index === -1 || chat.messages[index]?.role !== 'user')
    throw new Error('cadenza-ai: editAndResend needs the id of a user message.')
  if (chat.status !== 'ready')
    chat.stop()
  chat.setMessages(chat.messages.slice(0, index))
  await chat.sendMessage(content)
}

/**
 * A thinking part is done when the run is no longer streaming, when the
 * provider signed it, or when a later text / tool-call part has started.
 */
export function isThinkingComplete(message: UIMessage, partIndex: number, status: ChatClientState): boolean {
  if (status !== 'streaming')
    return true
  const part = message.parts[partIndex] as ThinkingPart | undefined
  if (part?.signature !== undefined)
    return true
  return message.parts.slice(partIndex + 1).some(p => p.type === 'text' || p.type === 'tool-call')
}

export interface Source {
  url: string
  title?: string
  snippet?: string
}

interface SourceLike {
  url?: unknown
  title?: unknown
  snippet?: unknown
}

function asSource(value: unknown): Source | undefined {
  if (typeof value !== 'object' || value === null)
    return undefined
  const { url, title, snippet } = value as SourceLike
  if (typeof url !== 'string')
    return undefined
  return {
    url,
    ...(typeof title === 'string' ? { title } : {}),
    ...(typeof snippet === 'string' ? { snippet } : {}),
  }
}

function collect(value: unknown, into: Source[]): void {
  if (Array.isArray(value)) {
    for (const item of value) {
      const source = asSource(item)
      if (source)
        into.push(source)
    }
  }
  else if (typeof value === 'object' && value !== null && 'results' in value) {
    collect((value).results, into)
  }
}

/**
 * Citations from provider-executed web search: an explicit `metadata.sources`
 * list, or the result payload of a search tool the provider ran itself.
 */
export function sourcesOf(message: UIMessage): Source[] {
  const found: Source[] = []
  for (const part of message.parts) {
    if (part.type !== 'tool-call')
      continue
    // The client-side tool-call part type has no `metadata` field, but the stream keeps it.
    const metadata = ((part as { metadata?: unknown }).metadata ?? {}) as { sources?: unknown, providerExecuted?: unknown }
    collect(metadata.sources, found)
    if (metadata.providerExecuted === true && /search/i.test(part.name))
      collect(part.output, found)
  }
  const seen = new Set<string>()
  return found.filter(s => (seen.has(s.url) ? false : (seen.add(s.url), true)))
}
