import type { RangeResult } from '@upstash/vector'
import type { ChunkMetadata, ComponentChunk, PreviewRef } from '../lib/component-chunks'
import type { Locale } from '../lib/i18n'
import { createHash } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { Index } from '@upstash/vector'
import { chunkComponentPage, chunkDemoSource, chunkSourceFile, MAX_CHUNK_CHARS, pageMeta, previewRefs } from '../lib/component-chunks'
import { hasIndexCredentials } from '../lib/component-search'
import { headingId } from '../lib/heading-id'
import { i18n, localizedHref } from '../lib/i18n'

// Builds the vector index the playground's `search_components` tool queries:
// the component doc pages (by section), the source of every demo a page shows
// (filed under the page and section it appears in), and the library's own source
// under packages/ui/src (sliced by blank line, linked to the lines on GitHub). Runs after
// `next build` on Vercel (see vercel.json) and by hand with
// `pnpm --filter docs index:components`; `--dry-run` only chunks and reports.
//
// The index must have been created with a built-in embedding model (text-embedding-3-small,
// the only one the Vercel Marketplace form offers; bge-m3 exists only in the Upstash console):
// we upsert raw text and Upstash embeds it, so nothing here needs a model key.

const root = path.resolve(import.meta.dirname, '..')
const content = path.join(root, 'content/docs')
const pages = path.join(content, 'components')
const demos = path.join(root, 'demos')
const repo = path.resolve(root, '..')
const librarySource = 'packages/ui/src'
// Links go to the default branch; a feature branch's slices can be a little ahead of it
const sourceUrl = 'https://github.com/GGGLHHH/cadenza/blob/master/'
const BATCH = 100

type Chunks = Record<Locale, ComponentChunk[]>
interface PageRef extends PreviewRef { title: string, url: string }

async function collectPages(): Promise<Chunks> {
  const out: Chunks = { zh: [], en: [] }
  for (const file of (await readdir(pages)).filter(name => name.endsWith('.mdx')).sort()) {
    const locale: Locale = file.endsWith('.en.mdx') ? 'en' : 'zh'
    const slug = file.replace(/(?:\.en)?\.mdx$/, '')
    out[locale].push(...chunkComponentPage(await readFile(path.join(pages, file), 'utf8'), slug, locale))
  }
  return out
}

/** Registry keys from `demos/index.tsx` — the one list of what counts as a demo. */
async function demoKeys(): Promise<Map<string, string>> {
  const registry = await readFile(path.join(demos, 'index.tsx'), 'utf8')
  const keys = new Map<string, string>()
  for (const match of registry.matchAll(/^\s+'([^']+)': lazy\(async \(\) => import\('\.\/([^']+)'\)\),$/gm))
    keys.set(match[1], path.join(demos, `${match[2]}.tsx`))
  return keys
}

/** Where each demo is shown: per locale, the page (title, url with anchor) and section. A section anchor beats the hero. */
async function demoPlacements(): Promise<Map<string, Partial<Record<Locale, PageRef>>>> {
  const placements = new Map<string, Partial<Record<Locale, PageRef>>>()
  for (const file of (await readdir(content, { recursive: true })).filter(name => name.endsWith('.mdx')).sort()) {
    const locale: Locale = file.endsWith('.en.mdx') ? 'en' : 'zh'
    const route = file.replace(/(?:\.en)?\.mdx$/, '').replace(/(?:^|\/)index$/, '')
    const source = await readFile(path.join(content, file), 'utf8')
    const { title } = pageMeta(source)
    const page = localizedHref(locale, route === '' ? '/docs' : `/docs/${route}`)
    for (const ref of previewRefs(source)) {
      const anchor = ref.heading === '' ? undefined : headingId(ref.heading)
      const current = placements.get(ref.name) ?? {}
      if (current[locale] !== undefined && current[locale].heading !== '')
        continue
      current[locale] = { ...ref, title, url: anchor === undefined ? page : `${page}#${anchor}` }
      placements.set(ref.name, current)
    }
  }
  return placements
}

async function collectDemos(): Promise<{ chunks: Chunks, unplaced: string[] }> {
  const out: Chunks = { zh: [], en: [] }
  const unplaced: string[] = []
  const placements = await demoPlacements()
  for (const [key, file] of await demoKeys()) {
    const placed = placements.get(key)
    if (placed === undefined) {
      unplaced.push(key)
      continue
    }
    const source = await readFile(file, 'utf8')
    for (const locale of i18n.languages) {
      const ref = placed[locale]
      if (ref !== undefined)
        out[locale].push(...chunkDemoSource(source, key, locale, ref))
    }
  }
  return { chunks: out, unplaced }
}

/** Every .ts/.tsx under packages/ui/src, the same slices in both locale namespaces. */
async function collectSources(): Promise<Chunks> {
  const out: Chunks = { zh: [], en: [] }
  const dir = path.join(repo, librarySource)
  for (const file of (await readdir(dir, { recursive: true })).filter(name => /\.tsx?$/.test(name)).sort()) {
    const relPath = `${librarySource}/${file}`
    const source = await readFile(path.join(dir, file), 'utf8')
    for (const locale of i18n.languages)
      out[locale].push(...chunkSourceFile(source, relPath, locale, `${sourceUrl}${relPath}`))
  }
  return out
}

function check(chunks: Chunks): void {
  for (const locale of i18n.languages) {
    const list = chunks[locale]
    if (list.length === 0)
      throw new Error(`${locale}: no chunks — is ${pages} still where the component pages live?`)
    const longest = Math.max(...list.map(chunk => chunk.text.length))
    if (longest > MAX_CHUNK_CHARS)
      throw new Error(`${locale}: a chunk is ${longest} chars, over the ${MAX_CHUNK_CHARS} cap`)
    const ids = new Set(list.map(chunk => chunk.id))
    if (ids.size !== list.length)
      throw new Error(`${locale}: duplicate chunk ids`)
    const demoCount = list.filter(chunk => chunk.id.includes(':demo/')).length
    const sourceCount = list.filter(chunk => chunk.id.includes(':src/')).length
    console.warn(`${locale}: ${list.length} chunks (${list.length - demoCount - sourceCount} doc sections + ${demoCount} demo sources + ${sourceCount} library source slices), longest ${longest} chars`)
  }
}

type Stored = ChunkMetadata & { hash: string }

/**
 * Incremental: read what the namespace holds (ids + content hashes; reads are
 * cheap), upsert only what changed, delete only what vanished. The free plan
 * counts every deleted vector as a write against its daily 10K, so a
 * reset-and-reupload of ~2.5K vectors per locale burns a day's quota in four runs.
 */
async function upload(chunks: Chunks): Promise<void> {
  const index = Index.fromEnv()
  for (const locale of i18n.languages) {
    const existing = new Map<string, string | undefined>()
    let cursor: string | number = 0
    do {
      const page: RangeResult<Stored> = await index.range<Stored>({ cursor, limit: 1000, includeMetadata: true }, { namespace: locale })
      for (const vector of page.vectors)
        existing.set(vector.id, vector.metadata?.hash)
      cursor = page.nextCursor
    } while (cursor !== '' && cursor !== undefined)
    const wanted = chunks[locale].map(chunk => ({ chunk, hash: createHash('sha1').update(chunk.text).digest('hex') }))
    const wantedIds = new Set(wanted.map(item => item.chunk.id))
    const stale = [...existing.keys()].filter(id => !wantedIds.has(id))
    const changed = wanted.filter(item => existing.get(item.chunk.id) !== item.hash)
    if (stale.length > 0)
      await index.delete(stale, { namespace: locale })
    for (let i = 0; i < changed.length; i += BATCH) {
      const batch = changed.slice(i, i + BATCH).map(({ chunk: { id, text, slug, title, heading, url }, hash }) => ({ id, data: text, metadata: { slug, title, heading, url, hash } satisfies Stored }))
      await index.upsert(batch, { namespace: locale })
    }
    console.warn(`${locale}: ${changed.length} upserted, ${stale.length} deleted, ${wanted.length - changed.length} unchanged in namespace "${locale}"`)
  }
}

async function main(): Promise<void> {
  const [docs, demoResult, sources] = await Promise.all([collectPages(), collectDemos(), collectSources()])
  const chunks: Chunks = { zh: [...docs.zh, ...demoResult.chunks.zh, ...sources.zh], en: [...docs.en, ...demoResult.chunks.en, ...sources.en] }
  if (demoResult.unplaced.length > 0)
    console.warn(`skipped ${demoResult.unplaced.length} demos no page shows: ${demoResult.unplaced.join(', ')}`)
  check(chunks)
  if (process.argv.includes('--dry-run'))
    return
  if (process.env.VERCEL !== undefined && process.env.VERCEL_ENV !== 'production') {
    console.warn(`skip: ${process.env.VERCEL_ENV} build must not overwrite the production index`)
    return
  }
  try {
    process.loadEnvFile(path.join(root, '.env.local'))
  }
  catch {
    // no .env.local: on Vercel the integration injected the variables already
  }
  if (!hasIndexCredentials()) {
    console.warn('skip: UPSTASH_VECTOR_REST_URL / UPSTASH_VECTOR_REST_TOKEN not set (vercel install upstash, then vercel env pull)')
    return
  }
  await upload(chunks)
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
