import type { ChunkMetadata } from './component-chunks'
import type { Locale } from './i18n'
import process from 'node:process'
import { Index } from '@upstash/vector'
import { MAX_CHUNK_CHARS } from './component-chunks'

export interface ComponentHit extends ChunkMetadata {
  score: number
  text: string
}

/**
 * Whether the Upstash Vector integration injected its credentials
 * (`vercel install upstash` → `UPSTASH_VECTOR_REST_URL` / `UPSTASH_VECTOR_REST_TOKEN`;
 * locally `vercel env pull`). CI and a bare checkout simply have no index.
 */
export function hasIndexCredentials(): boolean {
  return (process.env.UPSTASH_VECTOR_REST_URL ?? '') !== '' && (process.env.UPSTASH_VECTOR_REST_TOKEN ?? '') !== ''
}

/** Read once per function instance: the chat route registers the tool only when this is true. */
export const componentIndexAvailable = hasIndexCredentials()

let index: Index<ChunkMetadata> | undefined

/**
 * Semantic search over the component docs, one namespace per locale. The
 * index was created with a built-in embedding model (text-embedding-3-small), so the query
 * goes out as text and Upstash embeds it; no model key on our side.
 */
export async function searchComponents(query: string, locale: Locale, topK = 5): Promise<ComponentHit[]> {
  index ??= new Index<ChunkMetadata>()
  const hits = await index.query({ data: query, topK, includeMetadata: true, includeData: true }, { namespace: locale })
  return hits.flatMap((hit) => {
    if (hit.metadata === undefined)
      return []
    // A doc section is summarised by the model, so 1200 chars keep the tool card readable;
    // a demo or a source slice is quoted, so it comes back whole (a chunk is at most MAX_CHUNK_CHARS).
    // Fields picked by name: the indexer stores a content hash alongside, which is not for the model
    const { slug, title, heading, url } = hit.metadata
    const quoted = heading.startsWith('demo ') || heading.startsWith('source ')
    const cap = quoted ? MAX_CHUNK_CHARS : 1200
    return [{ slug, title, heading, url, score: Math.round(hit.score * 1000) / 1000, text: (hit.data ?? '').slice(0, cap) }]
  })
}
