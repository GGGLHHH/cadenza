import type { AgentLoopStrategy, AnyTool, ChatMiddleware, DebugOption, StreamDurability, SystemPrompt } from '@tanstack/ai'
import type { ProviderPreset } from './preset'
import type { Selection } from './selection'
import { chat, chatParamsFromRequest, mergeAgentTools, toServerSentEventsResponse } from '@tanstack/ai'
import { byokMissing, getByokKey } from '@tanstack/ai/byok/server'
import { pickSelection } from './selection'
import { resolveThinking } from './thinking'

export interface ChatHandlerOptions<TContext = unknown> {
  providers: readonly ProviderPreset[]
  /** `provider/model` used when the request carries no selection. */
  defaultModel?: string
  systemPrompts?: SystemPrompt[] | ((selection: Selection) => SystemPrompt[])
  /**
   * Client tools always merge in on top. Prefer the function form whenever any
   * entry is a provider tool (`webSearchTool()` and friends): those are branded
   * per vendor, and an adapter that does not recognise the brand silently
   * degrades the tool into a schema-less function call nothing can execute.
   */
  tools?: ReadonlyArray<AnyTool> | ((selection: Selection) => ReadonlyArray<AnyTool>)
  middleware?: Array<ChatMiddleware<TContext>>
  context?: (request: Request) => TContext | Promise<TContext>
  agentLoopStrategy?: AgentLoopStrategy
  /** Inspect or replace the resolved selection; return a `Response` to refuse the request. */
  onSelect?: (selection: Selection, request: Request) => Selection | Response
  /**
   * An `AIPersistence<ChatTranscriptStores>` from the optional peer
   * `@tanstack/ai-persistence`. Typed as `unknown` so this entry's declarations
   * never reference that package; the peer is imported lazily at request time.
   */
  persistence?: unknown
  /** `ReconstructChatOptions['authorize']` from `@tanstack/ai-persistence`; only read together with `persistence`. */
  authorize?: unknown
  durability?: (request: Request) => StreamDurability
  /** Default 4 MiB. */
  maxBodyBytes?: number
  /** Hosts an `x-byok-ollama` header may point at; default: loopback and RFC 1918 ranges. */
  ollamaHosts?: readonly string[]
  debug?: DebugOption
}

export interface ChatHandler {
  POST: (request: Request) => Promise<Response>
  GET: (request: Request) => Promise<Response>
}

/**
 * Route-handler pair for `/api/ai/chat`. The request lifecycle (spec §服务端):
 * size guard → parse → pick selection → onSelect → BYOK key → adapter →
 * thinking → chat() → SSE. `GET` serves persistence reconstruction and
 * durable-stream resumption when those options are present.
 */
export function createChatHandler<TContext = unknown>(options: ChatHandlerOptions<TContext>): ChatHandler {
  const onVercel = process.env.VERCEL === '1'
  // Local runtimes (ollama) cannot be reached from a serverless region.
  const presets = options.providers.filter(p => !(onVercel && p.runtime === 'local'))
  const maxBody = options.maxBodyBytes ?? 4 * 1024 * 1024

  async function POST(request: Request): Promise<Response> {
    const length = Number(request.headers.get('content-length') ?? 0)
    if (length > maxBody)
      return new Response('Payload too large', { status: 413 })
    let params: Awaited<ReturnType<typeof chatParamsFromRequest>>
    try {
      params = await chatParamsFromRequest(request)
    }
    catch (error) {
      if (error instanceof Response)
        return error
      throw error
    }
    const picked = pickSelection(params.forwardedProps ?? {}, presets, { defaultModel: options.defaultModel })
    if (picked instanceof Response)
      return picked
    const selection = options.onSelect ? options.onSelect(picked, request) : picked
    if (selection instanceof Response)
      return selection
    const { preset, model, thinking } = selection
    const key = preset.byok ? getByokKey(request, preset.byok) : null
    if (preset.keyRequired && key === null && preset.byok)
      return byokMissing(preset.byok)
    if (preset.id === 'ollama' && key !== null && !hostAllowed(key, options.ollamaHosts))
      return new Response('Ollama host not allowed', { status: 400 })
    const adapter = preset.create(model.id, key)
    const modelOptions = resolveThinking(preset, model, thinking)
    const abortController = new AbortController()
    // `chat()` types its `context` through a conditional over TContext that stays
    // deferred while TContext is generic, so the call is made in the `unknown`
    // context; the caller's own `context()` / `middleware` types are the truth.
    const middleware: ChatMiddleware[] = [...(options.middleware ?? [])] as ChatMiddleware[]
    if (options.persistence !== undefined) {
      const { withPersistence } = await import('@tanstack/ai-persistence')
      middleware.push(withPersistence(options.persistence as Parameters<typeof withPersistence>[0]))
    }
    const context: unknown = options.context ? await options.context(request) : undefined
    const stream = chat({
      adapter,
      messages: params.messages,
      threadId: params.threadId,
      runId: params.runId,
      parentRunId: params.parentRunId,
      resume: params.resume,
      tools: mergeAgentTools(typeof options.tools === 'function' ? options.tools(selection) : options.tools ?? [], params.tools),
      systemPrompts: typeof options.systemPrompts === 'function' ? options.systemPrompts(selection) : options.systemPrompts,
      modelOptions,
      middleware,
      agentLoopStrategy: options.agentLoopStrategy,
      context,
      abortController,
      debug: options.debug,
    })
    return toServerSentEventsResponse(stream, {
      abortController,
      ...(options.durability ? { durability: { adapter: options.durability(request) } } : {}),
      debug: options.debug,
    })
  }

  async function GET(request: Request): Promise<Response> {
    const url = new URL(request.url)
    if (options.persistence !== undefined && url.searchParams.has('threadId')) {
      const { reconstructChat } = await import('@tanstack/ai-persistence')
      return reconstructChat(
        options.persistence as Parameters<typeof reconstructChat>[0],
        request,
        { authorize: options.authorize } as Parameters<typeof reconstructChat>[2],
      )
    }
    if (options.durability && (url.searchParams.has('runId') || request.headers.has('last-event-id'))) {
      const { resumeServerSentEventsResponse } = await import('@tanstack/ai')
      return resumeServerSentEventsResponse({ adapter: options.durability(request) })
    }
    return new Response('Not found', { status: 404 })
  }

  return { POST, GET }
}

function hostAllowed(host: string, allow?: readonly string[]): boolean {
  let url: URL
  try {
    url = new URL(host)
  }
  catch {
    return false
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:')
    return false
  if (allow)
    return allow.some(a => url.host === a || url.hostname === a)
  const h = url.hostname
  return h === 'localhost' || h === '127.0.0.1' || h === '[::1]' || h.startsWith('10.') || h.startsWith('192.168.') || /^172\.(?:1[6-9]|2\d|3[01])\./.test(h)
}
