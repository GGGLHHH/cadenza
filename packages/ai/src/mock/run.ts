import type { ChatFetcher, ChatFetcherInput, ChatFetcherOptions } from '@tanstack/ai-client'
import type { Interrupt, RunAgentResumeItem, StreamChunk, UIMessage } from '@tanstack/ai/client'
import type { Step } from './steps'
import {
  canonicalInterruptJson,
  digestInterruptJson,
  EventType,
  generateMessageId,
  hashSchemaInput,
  INTERRUPT_BINDING_METADATA_KEY,
  INTERRUPT_BINDING_VERSION,
  normalizeApprovalSchema,
} from '@tanstack/ai/client'
import { text } from './steps'

export interface ScriptContext {
  messages: UIMessage[]
  lastUser?: UIMessage
  lastUserText: string
  /** Merged body: `forwardedProps` plus the per-call `sendMessage` body. */
  data: Record<string, unknown>
  threadId: string
  runId: string
  parentRunId?: string
  /** Resolutions of the previous run's interrupts; read with `approvalOf` / `clientResultOf`. */
  resume?: RunAgentResumeItem[]
  /** How many times this fetcher instance has been called before (starts at 0). */
  turn: number
  /** Fires on `stop()`. */
  signal: AbortSignal
}

export type Script = (ctx: ScriptContext) => Step[] | Iterable<Step> | AsyncIterable<Step> | Promise<Step[]> | Response

export interface ScriptedOptions {
  /** Delay between chunks in ms; `'instant'` skips the timers. Default 24. */
  pace?: number | 'instant'
  /** Default slicing for `text` / `reasoning`. Default `'word'`. */
  chunk?: 'word' | 'char' | number
  messageId?: () => string
  toolCallId?: () => string
}

type Chunking = NonNullable<ScriptedOptions['chunk']>
interface Pending { name: string, toolCallId: string, input: unknown, client: boolean }
type Usage = Extract<Step, { kind: 'usage' }>['usage']
type FinishReason = NonNullable<Extract<Step, { kind: 'finish' }>['finishReason']>

const DEFAULT_PACE = 24
// ponytail: every scripted tool shares one permissive input schema; the client
// binds a `tool-approval` interrupt only when its registered tool hashes to the
// same schema. Add an `inputSchema` option on the tool step if demos need zod-typed tools.
const INPUT_SCHEMA = { type: 'object', additionalProperties: true }
const CLIENT_RESPONSE_SCHEMA = { type: 'object' }

/** Turn a step script into a `ChatFetcher` for `useChat({ fetcher })`. */
export function scripted(script: Script, options: ScriptedOptions = {}): ChatFetcher {
  let turn = 0
  return async (input: ChatFetcherInput, { signal }: ChatFetcherOptions) => {
    const ctx = toContext(input, signal, turn++)
    const out = await script(ctx)
    if (out instanceof Response)
      return out
    return run(ctx, out, options)
  }
}

/** Turn n answers with `turns[n]`; past the end the last entry repeats. */
export function sequence(turns: Array<Step[] | Script>): Script {
  return (ctx) => {
    const t = turns[Math.min(ctx.turn, turns.length - 1)] ?? []
    return typeof t === 'function' ? t(ctx) : t
  }
}

export type RespondRule = [match: RegExp | string | ((ctx: ScriptContext) => boolean), reply: Step[] | Script]

/** Pick the first rule whose matcher hits `lastUserText`; otherwise `fallback` (default: `echo()`). */
export function respond(rules: RespondRule[], fallback: Step[] | Script = echo()): Script {
  return (ctx) => {
    const hit = rules.find(([match]) => typeof match === 'function'
      ? match(ctx)
      : typeof match === 'string' ? ctx.lastUserText.includes(match) : match.test(ctx.lastUserText))
    const reply = hit ? hit[1] : fallback
    return typeof reply === 'function' ? reply(ctx) : reply
  }
}

/** Repeat the last user message, listing attachment MIME types and `data.model` when present. */
export function echo(options: Pick<Extract<Step, { kind: 'text' }>, 'chunk' | 'pace'> = {}): Script {
  return (ctx) => {
    const mimes = (ctx.lastUser?.parts ?? [])
      .map(p => 'source' in p ? p.source.mimeType : undefined)
      .filter((m): m is string => typeof m === 'string')
    const lines = [ctx.lastUserText]
    if (mimes.length > 0)
      lines.push(`Attachments: ${mimes.join(', ')}`)
    if (typeof ctx.data.model === 'string')
      lines.push(`Model: ${ctx.data.model}`)
    return [text(lines.join('\n\n'), options)]
  }
}

/** A 401 the client turns into `byok.request(provider, 'missing')`. Return it from a script. */
export function byokMissing(provider: string): Response {
  return new Response(
    JSON.stringify({ error: { type: 'byok_missing', provider, message: `Missing ${provider} API key` } }),
    { status: 401, headers: { 'content-type': 'application/json' } },
  )
}

export interface ApprovalDecision {
  approved: boolean
  editedArgs?: unknown
  payload?: unknown
}

/** The user's decision for `tool(name, input, { approval: true })` from the previous run, if resolved. */
export function approvalOf(ctx: ScriptContext, toolCallId: string): ApprovalDecision | undefined {
  const payload: unknown = resolved(ctx, `approval_${toolCallId}`)?.payload
  if (typeof payload === 'boolean')
    return { approved: payload }
  if (typeof payload === 'object' && payload !== null && 'approved' in payload && typeof payload.approved === 'boolean') {
    const { approved, editedArgs, payload: extra } = payload as ApprovalDecision
    return { approved, ...(editedArgs !== undefined && { editedArgs }), ...(extra !== undefined && { payload: extra }) }
  }
  return undefined
}

/** The client-side output for `tool(name, input, { client: true })` from the previous run, if resolved. */
export function clientResultOf(ctx: ScriptContext, toolCallId: string): unknown {
  return resolved(ctx, `client_tool_${toolCallId}`)?.payload
}

function resolved(ctx: ScriptContext, interruptId: string): RunAgentResumeItem | undefined {
  return ctx.resume?.find(r => r.interruptId === interruptId && r.status === 'resolved')
}

function toContext(input: ChatFetcherInput, signal: AbortSignal, turn: number): ScriptContext {
  const lastUser = input.messages.findLast(m => m.role === 'user')
  return {
    messages: input.messages,
    lastUser,
    lastUserText: lastUser?.parts.map(p => p.type === 'text' ? p.content : '').join('') ?? '',
    data: input.data ?? {},
    threadId: input.threadId,
    runId: input.runId,
    parentRunId: input.parentRunId,
    resume: input.resume,
    turn,
    signal,
  }
}

function wait(signal: AbortSignal, ms: number): Promise<void> {
  if (ms <= 0 || signal.aborted)
    return Promise.resolve()
  return new Promise((resolve) => {
    let timer: ReturnType<typeof setTimeout> | undefined
    const done = (): void => {
      clearTimeout(timer)
      signal.removeEventListener('abort', done)
      resolve()
    }
    timer = setTimeout(done, ms)
    signal.addEventListener('abort', done, { once: true })
  })
}

function split(content: string, chunk: Chunking): string[] {
  if (chunk === 'char')
    return Array.from(content)
  if (chunk === 'word')
    return content.match(/\S+\s*|\s+/g) ?? []
  const size = Math.max(1, Math.floor(chunk))
  const out: string[] = []
  for (let i = 0; i < content.length; i += size)
    out.push(content.slice(i, i + size))
  return out
}

async function* run(ctx: ScriptContext, steps: Iterable<Step> | AsyncIterable<Step>, options: ScriptedOptions): AsyncGenerator<StreamChunk, void, undefined> {
  const { signal, threadId, runId, parentRunId } = ctx
  const pace = options.pace === 'instant' ? 0 : options.pace ?? DEFAULT_PACE
  const chunking = options.chunk ?? 'word'
  const messageId = options.messageId?.() ?? generateMessageId()
  const pending: Pending[] = []
  let textStarted = false
  let runUsage: Usage | undefined
  let finishReason: FinishReason | undefined

  yield { type: EventType.RUN_STARTED, threadId, runId, ...(parentRunId !== undefined && { parentRunId }) }

  // Slices content and paces every slice; returns false once aborted.
  async function* deltas(content: string, chunk: Chunking | undefined, stepPace: number | undefined): AsyncGenerator<string, boolean, undefined> {
    for (const delta of split(content, chunk ?? chunking)) {
      await wait(signal, stepPace ?? pace)
      if (signal.aborted)
        return false
      yield delta
    }
    return true
  }

  for await (const step of steps) {
    if (signal.aborted)
      return
    switch (step.kind) {
      case 'text': {
        if (!textStarted) {
          textStarted = true
          yield { type: EventType.TEXT_MESSAGE_START, messageId, role: 'assistant' }
        }
        for await (const delta of deltas(step.content, step.chunk, step.pace))
          yield { type: EventType.TEXT_MESSAGE_CONTENT, messageId, delta }
        break
      }
      case 'reasoning': {
        // One step id per block so consecutive blocks land in separate ThinkingParts.
        const stepId = generateMessageId()
        yield { type: EventType.STEP_STARTED, stepName: stepId }
        yield { type: EventType.REASONING_START, messageId: stepId }
        yield { type: EventType.REASONING_MESSAGE_START, messageId: stepId, role: 'reasoning' }
        for await (const delta of deltas(step.content, step.chunk, step.pace))
          yield { type: EventType.REASONING_MESSAGE_CONTENT, messageId: stepId, delta }
        yield { type: EventType.REASONING_MESSAGE_END, messageId: stepId }
        yield { type: EventType.REASONING_END, messageId: stepId }
        if (step.signature !== undefined)
          yield { type: EventType.STEP_FINISHED, stepName: stepId, signature: step.signature }
        break
      }
      case 'tool': {
        const toolCallId = step.toolCallId ?? options.toolCallId?.() ?? generateMessageId()
        const metadata = step.providerExecuted ? { ...step.metadata, providerExecuted: true } : step.metadata
        yield { type: EventType.TOOL_CALL_START, toolCallId, toolCallName: step.name, parentMessageId: messageId, ...(metadata && { metadata }) }
        const args = JSON.stringify(step.input ?? {})
        for (const delta of step.argsChunk !== undefined ? split(args, step.argsChunk) : [args]) {
          await wait(signal, pace)
          if (signal.aborted)
            return
          yield { type: EventType.TOOL_CALL_ARGS, toolCallId, delta }
        }
        yield { type: EventType.TOOL_CALL_END, toolCallId, input: step.input }
        if (step.approval || step.client) {
          pending.push({ name: step.name, toolCallId, input: step.input, client: Boolean(step.client) })
          break
        }
        yield toolResult(toolCallId, step.error !== undefined ? { error: step.error } : step.output, step.error !== undefined)
        break
      }
      case 'tool-result':
        yield toolResult(step.toolCallId, step.output, Boolean(step.error))
        break
      case 'custom':
        yield { type: EventType.CUSTOM, name: step.name, value: step.value }
        break
      case 'structured': {
        const raw = JSON.stringify(step.object)
        yield { type: EventType.CUSTOM, name: 'structured-output.start', value: { messageId } }
        if (!textStarted) {
          textStarted = true
          yield { type: EventType.TEXT_MESSAGE_START, messageId, role: 'assistant' }
        }
        for await (const delta of deltas(raw, step.chunk ?? 8, undefined))
          yield { type: EventType.TEXT_MESSAGE_CONTENT, messageId, delta }
        yield { type: EventType.CUSTOM, name: 'structured-output.complete', value: { object: step.object, raw } }
        break
      }
      case 'usage':
        runUsage = step.usage
        break
      case 'error':
        yield { type: EventType.RUN_ERROR, message: step.message, ...(step.code !== undefined && { code: step.code }) }
        return
      case 'sleep':
        await wait(signal, step.ms)
        break
      case 'finish':
        finishReason = step.finishReason
        break
    }
    if (signal.aborted)
      return
  }

  if (textStarted)
    yield { type: EventType.TEXT_MESSAGE_END, messageId }
  if (pending.length > 0) {
    yield {
      type: EventType.RUN_FINISHED,
      threadId,
      runId,
      outcome: { type: 'interrupt', interrupts: pending.map(p => p.client ? clientToolInterrupt(runId, p) : approvalInterrupt(runId, p)) },
      metadata: { tanstack: { finishReason: 'tool_calls' } },
    }
    return
  }
  yield {
    type: EventType.RUN_FINISHED,
    threadId,
    runId,
    // AG-UI `usage[]`; the client rebuilds it into TokenUsage and reads `totalTokens` verbatim
    ...(runUsage && { usage: [{ ...runUsage, totalTokens: runUsage.inputTokens + runUsage.outputTokens }] }),
    metadata: { tanstack: { finishReason: finishReason ?? 'stop' } },
  }
}

function toolResult(toolCallId: string, output: unknown, isError: boolean): StreamChunk {
  return {
    type: EventType.TOOL_CALL_RESULT,
    messageId: generateMessageId(),
    toolCallId,
    content: JSON.stringify(output ?? null),
    role: 'tool',
    ...(isError && { metadata: { tanstack: { state: 'output-error' } } }),
  }
}

// Mirrors the engine's `buildActionableInterrupts` (@tanstack/ai activities/chat/index.ts)
// plus the `interruptedRunId` / `generation` stamp it applies as the run finishes;
// the client's InterruptManager rejects a binding missing any of these.
function approvalInterrupt(runId: string, p: Pending): Interrupt {
  const id = `approval_${p.toolCallId}`
  const normalized = normalizeApprovalSchema(undefined, INPUT_SCHEMA)
  return {
    id,
    reason: 'tool_call',
    message: `Approval required to run ${p.name}`,
    toolCallId: p.toolCallId,
    responseSchema: normalized.responseSchema,
    metadata: {
      kind: 'approval',
      toolName: p.name,
      input: p.input,
      [INTERRUPT_BINDING_METADATA_KEY]: {
        v: INTERRUPT_BINDING_VERSION,
        kind: 'tool-approval',
        interruptId: id,
        toolName: p.name,
        toolCallId: p.toolCallId,
        originalArgs: p.input,
        inputSchemaHash: hashSchemaInput(INPUT_SCHEMA),
        approvalSchemaHash: normalized.approvalSchemaHash,
        responseSchemaHash: normalized.responseSchemaHash,
        interruptedRunId: runId,
        generation: 0,
      },
    },
  }
}

function clientToolInterrupt(runId: string, p: Pending): Interrupt {
  const id = `client_tool_${p.toolCallId}`
  return {
    id,
    reason: 'tanstack:client_tool_execution',
    message: `Client tool ${p.name} is ready to run`,
    toolCallId: p.toolCallId,
    responseSchema: CLIENT_RESPONSE_SCHEMA,
    metadata: {
      kind: 'client_tool',
      toolName: p.name,
      input: p.input,
      [INTERRUPT_BINDING_METADATA_KEY]: {
        v: INTERRUPT_BINDING_VERSION,
        kind: 'client-tool-execution',
        interruptId: id,
        toolName: p.name,
        toolCallId: p.toolCallId,
        outputSchemaHash: hashSchemaInput(undefined),
        responseSchemaHash: digestInterruptJson(canonicalInterruptJson(CLIENT_RESPONSE_SCHEMA)),
        interruptedRunId: runId,
        generation: 0,
      },
    },
  }
}
