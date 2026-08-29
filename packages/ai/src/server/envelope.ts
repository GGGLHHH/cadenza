// Request-body helpers shared by the generation and title handlers; not part of the public server surface.

export interface Envelope {
  forwardedProps: Record<string, unknown>
  threadId?: string
  runId?: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export interface SummarizeParams extends Envelope {
  input: { text: string, maxLength?: number, style?: 'bullet-points' | 'paragraph' | 'concise', focus?: string[] }
}

const SUMMARY_STYLES = ['bullet-points', 'paragraph', 'concise'] as const

// `generationParamsFromRequest` knows only the media kinds (no `'summarize'`),
// so this reads the same envelope `GenerationClient` posts: `{ data, forwardedProps, threadId, runId }` or the bare input.
export async function summarizeParamsFromRequest(request: Request): Promise<SummarizeParams> {
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
