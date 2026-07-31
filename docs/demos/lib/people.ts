import type { InfiniteSelectOption } from '@gedatou/cadenza-ui'

// 模拟数据源:10000 位作曲家 + 300–500ms 随机延时的分页接口。

export interface Person {
  id: string
  name: string
  role: string
  born: number
  works: number
}

const ROLES = ['Composer', 'Conductor', 'Pianist', 'Violinist', 'Cellist']
const NAMES = [
  'Bach',
  'Beethoven',
  'Brahms',
  'Chopin',
  'Debussy',
  'Dvořák',
  'Elgar',
  'Fauré',
  'Grieg',
  'Handel',
  'Haydn',
  'Liszt',
  'Mahler',
  'Mendelssohn',
  'Mozart',
  'Prokofiev',
  'Puccini',
  'Rachmaninoff',
  'Ravel',
  'Saint-Saëns',
  'Satie',
  'Schubert',
  'Schumann',
  'Shostakovich',
  'Sibelius',
  'Strauss',
  'Stravinsky',
  'Tchaikovsky',
  'Verdi',
  'Vivaldi',
]

export const TOTAL = 10000

export const PEOPLE: Person[] = Array.from({ length: TOTAL }, (_, index) => ({
  id: `p${index + 1}`,
  name: `${NAMES[index % NAMES.length]!} ${Math.floor(index / NAMES.length) + 1}`,
  role: ROLES[index % ROLES.length]!,
  born: 1650 + (index % 300),
  works: (index * 37) % 600,
}))

export function delay(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 200))
}

/** 游标分页(无限滚动用)。 */
export async function fetchPeople(options: {
  cursor?: number
  query?: string
  pageSize?: number
}): Promise<{ items: Person[], nextCursor?: number }> {
  await delay()
  const { cursor = 0, query, pageSize = 20 } = options
  const filtered = query
    ? PEOPLE.filter(person => person.name.toLowerCase().includes(query.toLowerCase()))
    : PEOPLE
  const items = filtered.slice(cursor, cursor + pageSize)
  const next = cursor + pageSize
  return { items, nextCursor: next < filtered.length ? next : undefined }
}

/** offset 分页(页码翻页用)。 */
export async function fetchPeoplePage(options: {
  page: number
  limit: number
}): Promise<{ items: Person[], total: number }> {
  await delay()
  const start = (options.page - 1) * options.limit
  return { items: PEOPLE.slice(start, start + options.limit), total: TOTAL }
}

export function getOption(person: Person): InfiniteSelectOption {
  return {
    id: person.id,
    label: person.name,
  }
}
