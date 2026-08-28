/**
 * Step DSL for the scripted transport — pure data, no runtime behaviour.
 * `run.ts` translates a list of steps into AG-UI events.
 */
export type Step
  = | { kind: 'text', content: string, chunk?: 'word' | 'char' | number, pace?: number }
    | { kind: 'reasoning', content: string, chunk?: 'word' | 'char' | number, pace?: number, signature?: string }
    | { kind: 'tool', name: string, input: unknown, output?: unknown, error?: string, argsChunk?: number, approval?: boolean, client?: boolean, providerExecuted?: boolean, metadata?: Record<string, unknown>, toolCallId?: string }
    | { kind: 'tool-result', toolCallId: string, output: unknown, error?: boolean }
    | { kind: 'custom', name: string, value: unknown }
    | { kind: 'structured', object: unknown, chunk?: number }
    | { kind: 'usage', usage: { inputTokens: number, outputTokens: number, reasoningTokens?: number, cachedInputTokens?: number } }
    | { kind: 'error', message: string, code?: string }
    | { kind: 'sleep', ms: number }
    | { kind: 'finish', finishReason?: 'stop' | 'length' | 'content_filter' | 'tool_calls' }

/** Assistant text. Several `text` steps in one run share a single assistant message. */
export const text = (content: string, o: Omit<Extract<Step, { kind: 'text' }>, 'kind' | 'content'> = {}): Step => ({ kind: 'text', content, ...o })
/** A thinking block; `signature` is attached via `STEP_FINISHED` the way the engine does it. */
export const reasoning = (content: string, o: Omit<Extract<Step, { kind: 'reasoning' }>, 'kind' | 'content'> = {}): Step => ({ kind: 'reasoning', content, ...o })
/**
 * A tool call. Without `approval` / `client` the result follows immediately;
 * with either, the run finishes on an interrupt and `tool.result` continues it next turn.
 */
export const tool = Object.assign(
  (name: string, input: unknown, o: Omit<Extract<Step, { kind: 'tool' }>, 'kind' | 'name' | 'input'> = {}): Step => ({ kind: 'tool', name, input, ...o }),
  { result: (toolCallId: string, output: unknown, o: { error?: boolean } = {}): Step => ({ kind: 'tool-result', toolCallId, output, ...o }) },
)
export const custom = (name: string, value: unknown): Step => ({ kind: 'custom', name, value })
export const structured = (object: unknown, o: { chunk?: number } = {}): Step => ({ kind: 'structured', object, ...o })
export const usage = (u: Extract<Step, { kind: 'usage' }>['usage']): Step => ({ kind: 'usage', usage: u })
export const error = (message: string, code?: string): Step => ({ kind: 'error', message, code })
export const sleep = (ms: number): Step => ({ kind: 'sleep', ms })
export const finish = (o: { finishReason?: Extract<Step, { kind: 'finish' }>['finishReason'] } = {}): Step => ({ kind: 'finish', ...o })
