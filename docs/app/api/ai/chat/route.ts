import { anthropic } from '@gedatou/cadenza-ai/providers/anthropic'
import { bedrock } from '@gedatou/cadenza-ai/providers/bedrock'
import { deepseek, deepseekWebSearch } from '@gedatou/cadenza-ai/providers/deepseek'
import { gemini } from '@gedatou/cadenza-ai/providers/gemini'
import { grok } from '@gedatou/cadenza-ai/providers/grok'
import { groq } from '@gedatou/cadenza-ai/providers/groq'
import { llmgateway } from '@gedatou/cadenza-ai/providers/llmgateway'
import { mistral } from '@gedatou/cadenza-ai/providers/mistral'
import { ollama } from '@gedatou/cadenza-ai/providers/ollama'
import { openai } from '@gedatou/cadenza-ai/providers/openai'
import { openrouter } from '@gedatou/cadenza-ai/providers/openrouter'
import { vercelGateway } from '@gedatou/cadenza-ai/providers/vercel-gateway'
import { vertex } from '@gedatou/cadenza-ai/providers/vertex'
import { createChatHandler, toolDefinition } from '@gedatou/cadenza-ai/server'
import { z } from 'zod'
import { componentIndexAvailable, searchComponents } from '@/lib/component-search'

// Playground is pure BYOK (spec Q1): model keys arrive per request in
// `x-byok-<provider>` headers; no provider key is read from the deployment's env.
// The one server-side credential is the Upstash Vector token behind
// `search_components`, injected by the Marketplace integration — the tool is
// only registered when it is present. `ollama` is dropped by the handler itself
// on Vercel (`runtime: 'local'`); `byteplus` is a placeholder and
// `openaiCompatiblePreset` needs a consumer's endpoint, so neither is wired.
export const maxDuration = 300

const getTime = toolDefinition({
  name: 'get_time',
  description: 'Current time in a timezone',
  inputSchema: z.object({ tz: z.string() }),
}).server(async ({ tz }) => ({ iso: new Date().toLocaleString('en-US', { timeZone: tz }) }))

/** What the route hands every server tool: the origin the visitor is on, so links can be absolute. */
interface ChatContext {
  origin: string
}

const searchComponentsTool = toolDefinition({
  name: 'search_components',
  description: 'Search the cadenza-ui docs and demo source code: which component, part or prop does something, how to use it, its states and keyboard interaction, the full source of the demos each page shows, and the library source itself under packages/ui/src (linked to the lines on GitHub). Use it for any question about this library or its components before any other tool.',
  inputSchema: z.object({
    query: z.string().min(1).max(300).describe('What the user wants to do or find, in their own words'),
    locale: z.enum(['zh', 'en']).describe('Docs language to search: the language the user writes in'),
  }),
}).server<ChatContext>(async ({ query, locale }, { context }) => ({
  // Absolute urls: handed a site-relative path, a model tends to invent a domain in front of it.
  // Source hits already carry their GitHub url. Plain concatenation keeps the CJK anchors readable.
  results: (await searchComponents(query, locale)).map(hit => ({ ...hit, url: hit.url.startsWith('/') ? `${context.origin}${hit.url}` : hit.url })),
}))

const serverTools = componentIndexAvailable ? [getTime, searchComponentsTool] : [getTime]

export const { POST, GET } = createChatHandler<ChatContext>({
  context: request => ({ origin: new URL(request.url).origin }),
  providers: [openai, anthropic, gemini, openrouter, grok, groq, mistral, vercelGateway, llmgateway, bedrock, vertex, ollama, deepseek],
  defaultModel: 'openai/gpt-5.2',
  systemPrompts: [
    'You are the cadenza docs playground assistant. Keep answers short.',
    ...(componentIndexAvailable
      ? ['Anything about cadenza-ui — its components, parts, props, demos, usage or implementation source — goes through search_components first; it returns doc sections, full demo source and library source slices with absolute urls — paste those urls verbatim as markdown links. Never use web_search for questions about this library; web_search is only for things outside its docs. Link the urls the tool returns.']
      : []),
  ],
  // The function form, because `deepseekWebSearch()` is a provider tool: any
  // adapter that does not know the brand degrades it into a schema-less
  // function call nothing can execute, so it must only reach DeepSeek. And it
  // only goes out when the user asked for it — `pickSelection` has already
  // checked `Model.search`, so a request cannot switch on what the model lacks.
  tools: sel => sel.preset.id === 'deepseek' && sel.search ? [...serverTools, deepseekWebSearch()] : serverTools,
})
