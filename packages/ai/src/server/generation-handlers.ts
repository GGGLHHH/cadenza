import type { AnySummarizeAdapter, AnyTranscriptionAdapter, DebugOption } from '@tanstack/ai'
import type { ByokProvider } from '@tanstack/ai/byok'
import { generateTranscription, generationParamsFromRequest, summarize, toServerSentEventsResponse } from '@tanstack/ai'
import { byokMissing, getByokKey } from '@tanstack/ai/byok/server'

export interface GenerationHandlerOptions<TAdapter> {
  /** Builds the adapter with the BYOK / env key; `null` when the provider needs no key. */
  adapter: (model: string, key: string | null) => TAdapter
  /** Which BYOK header / env holds the key; omit for keyless providers. */
  byok?: ByokProvider
  /** Model used unless `forwardedProps.model` names one. */
  defaultModel: string
  /** Default 8 MiB (base64 audio). */
  maxBodyBytes?: number
  debug?: DebugOption
}

export interface GenerationHandler {
  POST: (request: Request) => Promise<Response>
}

// Same shape `pickSelection` accepts (selection.ts): `vendor/model`, `model:tag`, `~vendor/alias`.
const MODEL_ID = /^[\w.\-:/~]{1,200}$/

interface Envelope {
  forwardedProps: Record<string, unknown>
  threadId?: string
  runId?: string
}

function bad(message: string, type?: string): Response {
  return type === undefined
    ? new Response(message, { status: 400 })
    : new Response(JSON.stringify({ error: { type } }), { status: 400, headers: { 'content-type': 'application/json' } })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * The part of the lifecycle both handlers share (spec §服务端, mirrored from
 * `createChatHandler`): size guard → parse → model → BYOK key → adapter.
 */
async function resolve<TAdapter, TParams extends Envelope>(
  request: Request,
  options: GenerationHandlerOptions<TAdapter>,
  parse: (request: Request) => Promise<TParams>,
): Promise<{ params: TParams, adapter: TAdapter } | Response> {
  const length = Number(request.headers.get('content-length') ?? 0)
  if (length > (options.maxBodyBytes ?? 8 * 1024 * 1024))
    return new Response('Payload too large', { status: 413 })
  let params: TParams
  try {
    params = await parse(request)
  }
  catch (error) {
    if (error instanceof Response)
      return error
    return bad(error instanceof Error ? error.message : 'Invalid request body')
  }
  const requested = params.forwardedProps.model
  let model = options.defaultModel
  if (requested !== undefined) {
    if (typeof requested !== 'string' || !MODEL_ID.test(requested))
      return bad('unknown model', 'unknown_model')
    model = requested
  }
  const key = options.byok ? getByokKey(request, options.byok) : null
  if (options.byok && key === null)
    return byokMissing(options.byok)
  return { params, adapter: options.adapter(model, key) }
}

/** `POST /api/ai/transcription` for `useTranscription({ connection })`: the body is the generation envelope, the reply an SSE run ending in `generation:result`. */
export function createTranscriptionHandler(options: GenerationHandlerOptions<AnyTranscriptionAdapter>): GenerationHandler {
  return {
    POST: async (request) => {
      const resolved = await resolve(request, options, req => generationParamsFromRequest('transcription', req))
      if (resolved instanceof Response)
        return resolved
      const { input, threadId, runId } = resolved.params
      if (typeof input.audio !== 'string')
        return bad('Transcription audio must be a base64 or data-URL string.')
      const abortController = new AbortController()
      // Only the documented fields cross the wire; `modelOptions` stays server-side.
      const stream = generateTranscription({
        adapter: resolved.adapter,
        audio: input.audio,
        language: input.language,
        prompt: input.prompt,
        responseFormat: input.responseFormat,
        threadId,
        runId,
        stream: true,
        abortSignal: abortController.signal,
        debug: options.debug,
      })
      return toServerSentEventsResponse(stream, { abortController, debug: options.debug })
    },
  }
}

interface SummarizeParams extends Envelope {
  input: { text: string, maxLength?: number, style?: 'bullet-points' | 'paragraph' | 'concise', focus?: string[] }
}

const SUMMARY_STYLES = ['bullet-points', 'paragraph', 'concise'] as const

// `generationParamsFromRequest` knows only the media kinds (no `'summarize'`),
// so this reads the same envelope `GenerationClient` posts: `{ data, forwardedProps, threadId, runId }` or the bare input.
async function summarizeParamsFromRequest(request: Request): Promise<SummarizeParams> {
  let body: unknown
  try {
    body = await request.json()
  }
  catch {
    throw new Error('Invalid JSON request body.')
  }
  if (!isRecord(body))
    throw new Error('Summarize request body must be a JSON object.')
  const input = isRecord(body.data) ? body.data : body
  if (typeof input.text !== 'string')
    throw new Error('Summarize input must include text.')
  const style = SUMMARY_STYLES.find(s => s === input.style)
  const focus = Array.isArray(input.focus) ? input.focus.filter((f): f is string => typeof f === 'string') : undefined
  return {
    input: {
      text: input.text,
      maxLength: typeof input.maxLength === 'number' ? input.maxLength : undefined,
      style,
      focus,
    },
    forwardedProps: isRecord(body.forwardedProps) ? body.forwardedProps : {},
    threadId: typeof body.threadId === 'string' ? body.threadId : undefined,
    runId: typeof body.runId === 'string' ? body.runId : undefined,
  }
}

/** `POST /api/ai/summarize` for `useSummarize({ connection })`; same lifecycle as the transcription handler. */
export function createSummarizeHandler(options: GenerationHandlerOptions<AnySummarizeAdapter>): GenerationHandler {
  return {
    POST: async (request) => {
      const resolved = await resolve(request, options, summarizeParamsFromRequest)
      if (resolved instanceof Response)
        return resolved
      const { input, threadId, runId } = resolved.params
      const abortController = new AbortController()
      const stream = summarize({
        adapter: resolved.adapter,
        ...input,
        threadId,
        runId,
        stream: true,
        abortSignal: abortController.signal,
        debug: options.debug,
      })
      return toServerSentEventsResponse(stream, { abortController, debug: options.debug })
    },
  }
}
