import type { Locale } from './i18n'
import { headingId } from './heading-id'
import { localizedHref } from './i18n'

/** What the index stores next to each vector; the search tool hands it back verbatim. */
// A type alias on purpose: `Index<T>` constrains T to `Record<string, unknown>`, which only a
// type literal satisfies through its implicit index signature — an interface does not.
// eslint-disable-next-line ts/consistent-type-definitions
export type ChunkMetadata = {
  slug: string
  title: string
  /** `''` for the page intro, otherwise `H2` or `H2 › H3` */
  heading: string
  url: string
}

export interface ComponentChunk extends ChunkMetadata {
  /** `${locale}:${slug}#${anchor}` — stable across runs, so a re-index replaces in place */
  id: string
  /** What gets embedded: title, heading, then the section body */
  text: string
}

/** bge-m3 reads 8192 tokens; CJK runs at about one token per character, so stay well under. */
export const MAX_CHUNK_CHARS = 4000

interface Section {
  heading: string
  lines: string[]
}

/**
 * One component page → the chunks worth embedding: the intro (frontmatter +
 * text before the first H2), then every H2 section. Sections longer than
 * `MAX_CHUNK_CHARS` split at their H3s, then by paragraph as a last resort.
 * JSX outside code fences (`<ComponentPreview />` and friends) is dropped;
 * code fences stay, they are the usage examples the assistant should quote.
 */
export function chunkComponentPage(source: string, slug: string, locale: Locale): ComponentChunk[] {
  const { title, description, body } = splitFrontmatter(source)
  const page = localizedHref(locale, `/docs/components/${slug}`)
  const [intro, ...sections] = splitSections(stripJsx(body.split('\n')), '## ')
  const chunks: ComponentChunk[] = []
  const seen = new Set<string>()

  // Every chunk opens with the page title, the section, and the page's one-line description:
  // the title is English on both locales, so the description is what anchors a zh section
  // ("按钮…") to a zh question about buttons. The intro chunk is the description itself.
  const label = (heading: string): string => (heading === '' ? title : `${title} — ${heading}\n${description}`)
  // The label rides along in every chunk, so the body's budget is what is left after it
  const budget = (heading: string): number => MAX_CHUNK_CHARS - label(heading).length - 2

  const push = (heading: string, anchor: string | undefined, bodyText: string): void => {
    const base = `${locale}:${slug}#${anchor ?? ''}`
    let id = base
    for (let n = 2; seen.has(id); n++)
      id = `${base}-${n}`
    seen.add(id)
    chunks.push({ id, slug, title, heading, url: anchor === undefined ? page : `${page}#${anchor}`, text: `${label(heading)}\n\n${bodyText}` })
  }

  for (const part of splitLong([description, '', ...intro.lines].join('\n'), budget('')))
    push('', undefined, part)

  for (const section of sections) {
    const anchor = headingId(section.heading)
    const parts = splitLong(section.lines.join('\n'), budget(section.heading))
    if (parts.length <= 1) {
      for (const part of parts)
        push(section.heading, anchor, part)
      continue
    }
    const [lead, ...subs] = splitSections(section.lines, '### ')
    for (const part of splitLong(lead.lines.join('\n'), budget(section.heading)))
      push(section.heading, anchor, part)
    for (const sub of subs) {
      const heading = `${section.heading} › ${sub.heading}`
      for (const part of splitLong(sub.lines.join('\n'), budget(heading)))
        push(heading, headingId(sub.heading), part)
    }
  }

  return chunks
}

function splitFrontmatter(source: string): { title: string, description: string, body: string } {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(source)
  const frontmatter = match?.[1] ?? ''
  const field = (name: string): string => {
    const raw = new RegExp(`^${name}:\\s*(.*)$`, 'm').exec(frontmatter)?.[1]?.trim() ?? ''
    return raw.replace(/^(["'])(.*)\1$/, '$2')
  }
  return { title: field('title'), description: field('description'), body: match ? source.slice(match[0].length) : source }
}

/** Drop JSX lines outside code fences; inside a fence everything is example code and stays. */
function stripJsx(lines: string[]): string[] {
  let fenced = false
  return lines.filter((line) => {
    if (/^\s*```/.test(line)) {
      fenced = !fenced
      return true
    }
    return fenced || !/^\s*<\/?[A-Z]/.test(line)
  })
}

/** Cut at headings of one level (`## ` or `### `), fence-aware; index 0 is whatever precedes the first heading. */
function splitSections(lines: string[], marker: string): [Section, ...Section[]] {
  const sections: [Section, ...Section[]] = [{ heading: '', lines: [] }]
  let fenced = false
  for (const line of lines) {
    if (/^\s*```/.test(line))
      fenced = !fenced
    if (!fenced && line.startsWith(marker)) {
      sections.push({ heading: line.slice(marker.length).trim(), lines: [] })
      continue
    }
    sections[sections.length - 1].lines.push(line)
  }
  return sections
}

/** Paragraph-wise packing under `limit`; a single oversized paragraph is sliced hard. */
function splitLong(text: string, limit: number): string[] {
  const trimmed = text.replace(/\n{3,}/g, '\n\n').trim()
  if (trimmed.length <= limit)
    return trimmed === '' ? [] : [trimmed]
  const parts: string[] = []
  let current = ''
  for (const paragraph of trimmed.split('\n\n')) {
    if (current !== '' && current.length + paragraph.length + 2 > limit) {
      parts.push(current)
      current = ''
    }
    if (paragraph.length > limit) {
      for (let i = 0; i < paragraph.length; i += limit)
        parts.push(paragraph.slice(i, i + limit))
      continue
    }
    current = current === '' ? paragraph : `${current}\n\n${paragraph}`
  }
  if (current !== '')
    parts.push(current)
  return parts
}

/** Frontmatter `title` / `description` of any docs page. */
export function pageMeta(source: string): { title: string, description: string } {
  const { title, description } = splitFrontmatter(source)
  return { title, description }
}

export interface PreviewRef {
  /** The registry key, `family/name` */
  name: string
  /** Nearest heading above the preview (H2 or H3); `''` when it is the page hero */
  heading: string
}

/** Every `<ComponentPreview name="…" />` in a page, each with the section it sits in. */
export function previewRefs(source: string): PreviewRef[] {
  const refs: PreviewRef[] = []
  let heading = ''
  let fenced = false
  for (const line of source.split('\n')) {
    if (/^\s*```/.test(line))
      fenced = !fenced
    if (fenced)
      continue
    const h = /^#{2,3} (.+)$/.exec(line)
    if (h)
      heading = h[1].trim()
    const preview = /<ComponentPreview\b[^>]*\sname="([^"]+)"/.exec(line)
    if (preview)
      refs.push({ name: preview[1], heading })
  }
  return refs
}

/**
 * One demo file → chunks of its source, labelled with the page and section that
 * show it, so "the source of the pending demo" lands on the same page anchor the
 * reader would open. Long demos split by blank line like any other section.
 */
export function chunkDemoSource(source: string, key: string, locale: Locale, page: { title: string, heading: string, url: string }): ComponentChunk[] {
  const heading = page.heading === '' ? `demo ${key}` : `demo ${key} · ${page.heading}`
  const label = `${page.title} — ${heading}`
  const parts = splitLong(source, MAX_CHUNK_CHARS - label.length - 2)
  return parts.map((part, i) => ({
    id: `${locale}:demo/${key}${i === 0 ? '' : `-${i + 1}`}`,
    slug: key.slice(0, key.indexOf('/')),
    title: page.title,
    heading,
    url: page.url,
    text: `${label}\n\n${part}`,
  }))
}

/**
 * A library source file → chunks packed from blank-line blocks, each knowing
 * its line range so the url can point straight at those lines on GitHub.
 * Filed under the file stem (`button` for `components/button.tsx`), which is
 * the same slug the Button page and its demos use.
 */
export function chunkSourceFile(source: string, relPath: string, locale: Locale, fileUrl: string): ComponentChunk[] {
  const stem = relPath.slice(relPath.lastIndexOf('/') + 1).replace(/\.tsx?$/, '')
  // The label names the thing in both languages the questions come in — "源码 / source" is what
  // a "how is X implemented" question carries — and leaves room for six-digit line numbers
  const label = `${stem} 源码 source: ${relPath}`
  const budget = MAX_CHUNK_CHARS - label.length - 24
  const chunks: ComponentChunk[] = []
  let start = 0
  let buffer: string[] = []
  let length = 0
  const flush = (end: number): void => {
    if (buffer.length === 0)
      return
    chunks.push({
      id: `${locale}:src/${relPath}#L${start}`,
      slug: stem,
      title: relPath,
      heading: `source ${relPath}#L${start}-L${end}`,
      url: `${fileUrl}#L${start}-L${end}`,
      text: `${label} (lines ${start}–${end})\n\n${buffer.join('\n').trim()}`,
    })
    buffer = []
    length = 0
  }
  const lines = source.split('\n')
  let blockStart = 1
  let block: string[] = []
  const takeBlock = (endLine: number): void => {
    const size = block.join('\n').length + 1
    if (length > 0 && length + size > budget)
      flush(blockStart - 1)
    if (buffer.length === 0)
      start = blockStart
    if (size > budget) {
      // One block over budget (a very long JSDoc or a big table of variants): split it by lines
      for (const line of block) {
        if (length + line.length + 1 > budget && buffer.length > 0)
          flush(start + buffer.length - 1)
        if (buffer.length === 0)
          start = blockStart + block.indexOf(line)
        buffer.push(line)
        length += line.length + 1
      }
    }
    else {
      buffer.push(...block)
      length += size
    }
    block = []
    blockStart = endLine + 1
  }
  lines.forEach((line, i) => {
    const lineNo = i + 1
    if (line.trim() === '') {
      if (block.length > 0)
        takeBlock(lineNo - 1)
      blockStart = lineNo + 1
      if (buffer.length > 0) {
        buffer.push('')
        length += 1
      }
      return
    }
    if (block.length === 0)
      blockStart = lineNo
    block.push(line)
  })
  if (block.length > 0)
    takeBlock(lines.length)
  flush(lines.length)
  return chunks
}
