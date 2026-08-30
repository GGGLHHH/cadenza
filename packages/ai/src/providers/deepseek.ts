import type { AdapterYieldChunk, AnyTool, ModelMessage, TextOptions } from '@tanstack/ai'
import { EventType } from '@tanstack/ai'
import { OpenAICompatibleResponsesAdapter, openaiCompatibleText } from '@tanstack/ai-openai/compatible'
import { convertToolsToProviderFormat, webSearchTool } from '@tanstack/ai-openai/tools'
import { deepseek as data } from '../catalog/providers/deepseek'
import { definePreset } from '../server/preset'
import { deepseekResponsesThinking } from '../server/thinking'
import { openaiCompatiblePreset } from './openai-compatible'

const BASE_URL = 'https://api.deepseek.com'

type Client = ConstructorParameters<typeof OpenAICompatibleResponsesAdapter>[0]

/** What the built-in search reports as. `sourcesOf` keys on a provider-executed call whose name matches `/search/i`. */
const SEARCH_TOOL = 'web_search'

interface SearchCallItem { type?: string, id?: string, action?: unknown }

/**
 * A `web_search_call` output item wearing the `function_call` shape.
 *
 * The base adapter's stream handler only knows `function_call` items, so every
 * other kind — DeepSeek's server-side searches included — is dropped: no events,
 * no content, no trace. Dropping them is not merely lossy. The client's stream
 * processor keeps one text buffer per *message* and only clears it on
 * `TOOL_CALL_START`, while it starts a *new* text part whenever some other part
 * type lands in between. DeepSeek's search auto-continues up to 10 rounds inside
 * one response — reasoning, text, search, reasoning, text — so with the searches
 * invisible the reasoning splits the parts while nothing resets the buffer, and
 * every text block repeats all the earlier ones.
 *
 * Reporting the search as a tool call is therefore both the honest mapping and
 * the fix: it is what `@ai-sdk/openai` does with the same wire items, it gives
 * the run its segment boundaries back, and it puts the searches on screen.
 */
function asFunctionCall(event: Record<string, unknown>): Record<string, unknown> {
  const item = event.item as SearchCallItem | undefined
  if (item?.type !== 'web_search_call' || item.id === undefined)
    return event
  // `action` describes what the server did (search / open_page / find_in_page); it rides along as the call's input.
  return { ...event, item: { type: 'function_call', id: item.id, call_id: item.id, name: SEARCH_TOOL, arguments: JSON.stringify(item.action ?? {}) } }
}

async function* rewriteSearchCalls(stream: AsyncIterable<unknown>): AsyncIterable<unknown> {
  for await (const event of stream) {
    const raw = event as Record<string, unknown>
    yield raw.type === 'response.output_item.added' || raw.type === 'response.output_item.done' ? asFunctionCall(raw) : raw
  }
}

function isAsyncIterable(value: unknown): value is AsyncIterable<unknown> {
  return typeof value === 'object' && value !== null && Symbol.asyncIterator in value
}

/**
 * The same client with `responses.create` teed through the rewrite — the base
 * reaches for nothing else on it. `Object.create` rather than a spread: these are
 * SDK class instances, so their methods live on the prototype.
 */
function withSearchCalls(client: Client): Client {
  const inner = client.responses
  const create = async (...args: Parameters<typeof inner.create>): Promise<unknown> => {
    const result = await inner.create(...args)
    return isAsyncIterable(result) ? rewriteSearchCalls(result) : result
  }
  const responses = Object.create(inner, { create: { value: create } }) as typeof inner
  return Object.create(client, { responses: { value: responses } }) as Client
}

interface Item { type?: string, role?: string, call_id?: unknown, [key: string]: unknown }

/**
 * The built-in searches in a history, keyed by the call id they were rewritten
 * under, each already shaped back into the `web_search_call` DeepSeek issued.
 * Keyed off `metadata.providerExecuted` rather than the tool name, so a
 * consumer's own function called `web_search` is never mistaken for one.
 */
function restorableSearches(messages: Array<ModelMessage>): Map<string, Item> {
  const searches = new Map<string, Item>()
  for (const message of messages) {
    if (message.role !== 'assistant')
      continue
    for (const toolCall of message.toolCalls ?? []) {
      const metadata = toolCall.metadata as { providerExecuted?: boolean, itemId?: string } | undefined
      if (metadata?.providerExecuted !== true || toolCall.function.name !== SEARCH_TOOL)
        continue
      const raw = toolCall.function.arguments
      let action: unknown
      try {
        action = typeof raw === 'string' ? JSON.parse(raw) : raw
      }
      catch {
        continue
      }
      if (typeof action !== 'object' || action === null)
        continue
      searches.set(toolCall.id, { type: 'web_search_call', id: metadata.itemId ?? toolCall.id, action, status: 'completed' })
    }
  }
  return searches
}

/**
 * The compatible Responses adapter with one fix: its base converts *every* tool
 * with `convertToolsToResponsesFormat`, which forces `{ type: 'function' }` and
 * so degrades a provider tool into a schema-less function call nothing can
 * execute. Routing through `convertToolsToProviderFormat` — which dispatches on
 * the tool's private `metadata.__kind` — is exactly what `OpenAITextAdapter`
 * does for the same reason, and is what lets `deepseekWebSearch()` reach the
 * wire as `{ type: 'web_search' }`.
 *
 * Module-private: its declaration would need the openai SDK's types, which this
 * package cannot name; `deepseek.create()` is the way to one.
 */
class DeepSeekResponsesAdapter extends OpenAICompatibleResponsesAdapter<string> {
  constructor(client: Client, model: string) {
    super(client, model, 'deepseek')
    // An accessor rather than a wrapped constructor argument, so the rewrite
    // survives every way the client can arrive — including a test swapping one
    // in after construction. Wrapping twice is harmless: the second pass sees
    // `function_call` items and leaves them alone.
    let wrapped = withSearchCalls(client)
    Object.defineProperty(this, 'client', {
      configurable: true,
      get: () => wrapped,
      set: (next: Client) => { wrapped = withSearchCalls(next) },
    })
  }

  /**
   * Mark the rewritten search calls provider-executed. Without it the agent loop
   * would count them as pending client work forever (`isProviderExecutedToolCall`
   * gates that in `@tanstack/ai`), and the tool card would spin: the processor
   * treats a provider-executed call as already complete.
   */
  override async* chatStream(options: TextOptions): AsyncGenerator<AdapterYieldChunk> {
    const searches = new Set<string>()
    for await (const chunk of super.chatStream(options)) {
      const event = chunk as { type: string, toolName?: string, toolCallId?: string, input?: unknown, metadata?: Record<string, unknown> }
      if (event.type === EventType.TOOL_CALL_START && event.toolName === SEARCH_TOOL && event.toolCallId !== undefined) {
        searches.add(event.toolCallId)
        yield { ...chunk, metadata: { ...event.metadata, providerExecuted: true } }
        continue
      }
      yield chunk
      if (event.type !== EventType.TOOL_CALL_END || event.toolCallId === undefined || !searches.delete(event.toolCallId))
        continue
      // The search already ran on DeepSeek's side, so its own record of what it
      // did is the result. Without one the call would sit at `input-complete`
      // and the card would claim it is still running.
      yield {
        type: EventType.TOOL_CALL_RESULT,
        toolCallId: event.toolCallId,
        toolCallName: SEARCH_TOOL,
        messageId: `${event.toolCallId}-result`,
        role: 'tool',
        content: JSON.stringify(event.input ?? {}),
        timestamp: Date.now(),
      } as unknown as AdapterYieldChunk
    }
  }

  /**
   * Rebuild one assistant turn the way DeepSeek wants to read it back.
   *
   * Two things have to be true at once, both measured against the live API on
   * 2026-08-30 rather than reasoned about:
   *
   * 1. **Every `function_call` must sit next to its `function_call_output`.**
   *    The base emits an assistant message as `[...function_call, message]`
   *    while the outputs arrive as the *next* messages, so a turn that called a
   *    tool and then answered replays as `function_call → message →
   *    function_call_output`. DeepSeek documents `function_call` as "merged into
   *    the adjacent assistant message": the call is folded into the message
   *    behind it, that turn closes, and the output left over pairs with nothing
   *    — `400 No tool output found for tool call <call_id>` on the user's next
   *    question, every time the previous one used a tool. A `web_search_call`
   *    between the two breaks it in exactly the same way.
   * 2. **A built-in search must go back as the `web_search_call` it was.** We
   *    rewrite those items into `function_call`s on the way in, because that is
   *    the only signal that keeps the client's text segments apart (see
   *    `asFunctionCall`) — but the rewrite must not reach the wire. DeepSeek
   *    "automatically restores the search results" for a `web_search_call`
   *    passed back as-is; hand it the rewritten `function_call` instead and the
   *    results are gone, so the model searches again on every follow-up.
   *
   * Hence the order `[assistant message, calls, outputs, searches]`. The search
   * items carry no output of their own, so their own `function_call_output` is
   * dropped. A search whose action no longer parses simply stays a plain
   * function call: accepted too, only costing the re-search.
   */
  protected override convertMessagesToInput(messages: Array<ModelMessage>): ReturnType<OpenAICompatibleResponsesAdapter<string>['convertMessagesToInput']> {
    const searches = restorableSearches(messages)
    const input = super.convertMessagesToInput(messages) as unknown as Item[]
    const output: Item[] = []
    for (let i = 0; i < input.length;) {
      if (input[i].type !== 'function_call') {
        output.push(input[i])
        i += 1
        continue
      }
      const calls: Item[] = []
      const restored: Item[] = []
      let end = i
      while (end < input.length && input[end].type === 'function_call') {
        const search = searches.get(String(input[end].call_id))
        if (search === undefined)
          calls.push(input[end])
        else
          restored.push(search)
        end += 1
      }
      const next: Item | undefined = input[end]
      const message = next?.type === 'message' && next.role === 'assistant' ? next : undefined
      if (message !== undefined)
        end += 1
      const outputs: Item[] = []
      while (end < input.length && input[end].type === 'function_call_output') {
        if (!searches.has(String(input[end].call_id)))
          outputs.push(input[end])
        end += 1
      }
      if (message !== undefined)
        output.push(message)
      output.push(...calls, ...outputs, ...restored)
      i = end
    }
    return output as unknown as ReturnType<OpenAICompatibleResponsesAdapter<string>['convertMessagesToInput']>
  }

  // eslint-disable-next-line ts/explicit-function-return-type -- the wire type is the openai SDK's `ResponseCreateParams`, which this package cannot name; the base's signature is the contract.
  protected override mapOptionsToRequest(options: TextOptions) {
    const { tools: _dropped, ...request } = super.mapOptionsToRequest({ ...options, tools: undefined })
    const tools = options.tools ? convertToolsToProviderFormat(options.tools) : undefined
    return tools !== undefined && tools.length > 0 ? { ...request, tools } : request
  }
}

/**
 * DeepSeek's server-side web search: the model searches, opens and reads pages
 * itself (auto-continuing up to 10 rounds) before answering, and nothing is
 * executed on our side. Only the Responses endpoint has it — Chat Completions
 * still documents `function` as the one tool type.
 *
 * The wire shape is OpenAI's, so this is that factory; DeepSeek ignores the
 * extra `search_context_size` / `user_location` fields it can carry.
 *
 * Hand it to `createChatHandler` through the *function* form of `tools`, so it
 * only ever reaches DeepSeek:
 *
 * ```ts
 * tools: sel => sel.preset.id === 'deepseek' ? [deepseekWebSearch()] : []
 * ```
 */
export function deepseekWebSearch(): AnyTool {
  return webSearchTool({ type: 'web_search' })
}

const compatible = openaiCompatiblePreset({
  id: data.id,
  label: data.label,
  baseURL: BASE_URL,
  env: 'DEEPSEEK_API_KEY',
  models: data.models,
  api: 'responses',
  thinking: deepseekResponsesThinking,
})

/**
 * DeepSeek speaks three protocols under one host and they are not equal: only
 * `/responses` carries the built-in `web_search` tool, and only there does
 * thinking arrive as the standard `response.reasoning_text.delta` (which the
 * base adapter already parses) instead of Chat Completions'
 * `delta.reasoning_content` (which it ignores, and which forced a hand-written
 * subclass plus `reasoning_content` echo on every assistant turn). So the
 * preset is the compatible one over `/responses`, with the adapter swapped for
 * the tool-converter fix above. The `openai` client is borrowed from the
 * compatible factory: this package cannot resolve the SDK itself.
 */
export const deepseek = definePreset({
  ...compatible,
  create: (model, key) => {
    const base = openaiCompatibleText(model, { baseURL: BASE_URL, apiKey: key ?? '', name: 'deepseek', api: 'responses' })
    return new DeepSeekResponsesAdapter((base as unknown as { client: Client }).client, model)
  },
})
