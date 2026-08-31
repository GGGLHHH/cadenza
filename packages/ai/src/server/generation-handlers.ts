import type { AnySummarizeAdapter, AnyTranscriptionAdapter, DebugOption } from '@tanstack/ai'
import type { ByokProvider } from '@tanstack/ai/byok'
import type { Envelope } from './envelope'
import { generateTranscription, generationParamsFromRequest, summarize, toServerSentEventsResponse } from '@tanstack/ai'
import { byokMissing, getByokKey } from '@tanstack/ai/byok/server'
import { summarizeParamsFromRequest } from './envelope'

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

function bad(message: string, type?: string): Response {
  return type === undefined
    ? new Response(message, { status: 400 })
    : new Response(JSON.stringify({ error: { type } }), { status: 400, headers: { 'content-type': 'application/json' } })
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
