import type { AnyTextAdapter, DebugOption, SummarizationOptions, SummarizationResult, SummarizeAdapter } from '@tanstack/ai'
import type { GenerationHandler } from './generation-handlers'
import type { ProviderPreset } from './preset'
import { chat, summarize, toServerSentEventsResponse } from '@tanstack/ai'
import { byokMissing, getByokKey } from '@tanstack/ai/byok/server'
import { summarizeParamsFromRequest } from './envelope'
import { pickSelection } from './selection'
import { resolveThinking } from './thinking'

export interface TitleHandlerOptions {
  providers: readonly ProviderPreset[]
  /** `vendor/model` used when `forwardedProps` names none; normally the conversation's own selection arrives. */
  defaultModel?: string
  /** Upper bound the instruction asks for. Default 6 — a sidebar row, not a sentence. */
  maxWords?: number
  /** Replace the instruction; receives `maxWords`. */
  prompt?: (maxWords: number) => string
  /** Default 1 MiB. */
  maxBodyBytes?: number
  debug?: DebugOption
}

/**
 * The ChatGPT rule: name the conversation from its first exchange, in the
 * user's language, a handful of words, nothing around it.
 */
export function defaultTitlePrompt(maxWords: number): string {
  return [
    'You name conversations.',
    `Given the first exchange of a chat, reply with a title of at most ${maxWords} words, in the language the user wrote in.`,
    'Output only the title: no quotes, no trailing punctuation, no markdown, no explanation.',
  ].join(' ')
}

const WRAPPING = /^["'“”‘’«»「」『』`*_\s]+|["'“”‘’«»「」『』`*_\s]+$/g
const TRAILING = /[.。!！?？:：;；,，、]+$/

/** Strip what models add anyway — fences, a `Title:` label, quotes, trailing punctuation — and keep one line. */
export function cleanTitle(raw: string, maxLength = 80): string {
  const line = raw.replace(/```[a-z]*/gi, ' ').split('\n').map(l => l.trim()).find(l => l !== '') ?? ''
  const title = line.replace(/^title\s*[:：]\s*/i, '').replace(WRAPPING, '').replace(TRAILING, '').replace(/\s+/g, ' ').trim()
  return title.length > maxLength ? `${title.slice(0, maxLength)}…` : title
}

/** A summarize adapter over a text adapter: the summary is the title, so `useSummarize` on the client needs no new protocol. */
function titleAdapter(adapter: AnyTextAdapter, systemPrompt: string, modelOptions: Record<string, unknown>): SummarizeAdapter<string, object> {
  const model = adapter.model as string
  return {
    'kind': 'summarize',
    'name': adapter.name,
    'model': model,
    '~types': { providerOptions: {} },
    'summarize': async ({ text, abortSignal }: SummarizationOptions<object>): Promise<SummarizationResult> => {
      const abortController = new AbortController()
      abortSignal?.addEventListener('abort', () => abortController.abort(), { once: true })
      const raw = await chat<AnyTextAdapter, undefined, false>({
        adapter,
        messages: [{ role: 'user', content: text }],
        systemPrompts: [systemPrompt],
        modelOptions,
        stream: false,
        abortController,
      })
      return { id: crypto.randomUUID(), model, summary: cleanTitle(raw), usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 } }
    },
  }
}

/**
 * `POST /api/ai/title` for `useSummarize({ connection })`: the same envelope and
 * SSE reply as the summarize handler, but the model is whichever the
 * conversation selected (`forwardedProps.provider` / `model`, thinking off), and
 * the reply is a title, not a summary.
 */
export function createTitleHandler(options: TitleHandlerOptions): GenerationHandler {
  const systemPrompt = (options.prompt ?? defaultTitlePrompt)(options.maxWords ?? 6)
  return {
    POST: async (request) => {
      const length = Number(request.headers.get('content-length') ?? 0)
      if (length > (options.maxBodyBytes ?? 1024 * 1024))
        return new Response('Payload too large', { status: 413 })
      let params: Awaited<ReturnType<typeof summarizeParamsFromRequest>>
      try {
        params = await summarizeParamsFromRequest(request)
      }
      catch (error) {
        return new Response(error instanceof Error ? error.message : 'Invalid request body', { status: 400 })
      }
      const picked = pickSelection(params.forwardedProps, options.providers, { defaultModel: options.defaultModel })
      if (picked instanceof Response)
        return picked
      const { preset, model } = picked
      const key = preset.byok ? getByokKey(request, preset.byok) : null
      if (preset.keyRequired && key === null && preset.byok)
        return byokMissing(preset.byok)
      const adapter = titleAdapter(preset.create(model.id, key), systemPrompt, resolveThinking(preset, model, 'off'))
      const abortController = new AbortController()
      const stream = summarize({
        adapter,
        text: params.input.text,
        threadId: params.threadId,
        runId: params.runId,
        stream: true,
        abortSignal: abortController.signal,
        debug: options.debug,
      })
      return toServerSentEventsResponse(stream, { abortController, debug: options.debug })
    },
  }
}
