import type { DataTableColumn } from '@gedatou/cadenza-ui'
import type { ReactElement } from 'react'
import type { Person } from '../lib/people'
import { DataTable } from '@gedatou/cadenza-ui'
import { PEOPLE } from '../lib/people'

const BLURBS = [
  '以对位法著称。',
  '晚期作品以宏大的结构与浓烈的情感著称,对后世交响乐影响深远,至今仍是音乐会保留曲目。',
  '专注于室内乐与艺术歌曲,笔触细腻。',
  '歌剧与宗教音乐并重,旋律感极强,生前即享有盛名,作品在欧洲各大剧院常演不衰;晚年转向教学,门生众多。',
  '民族乐派代表人物,善用民间旋律。',
]

interface PersonWithBio extends Person {
  bio: string
}

const people: PersonWithBio[] = PEOPLE.map((person, index) => ({
  ...person,
  bio: BLURBS[index % BLURBS.length]!,
}))

const columns: DataTableColumn<PersonWithBio>[] = [
  { id: 'name', header: '姓名', cell: person => person.name, isRowHeader: true, width: 140 },
  // 单元格默认 nowrap,需要换行的列自己开
  { id: 'bio', header: '简介', cell: person => person.bio, className: 'whitespace-normal' },
]

// 行高由内容决定:rowHeight 降级为估算,渲染后实测校正
export default function DynamicRowHeightDemo(): ReactElement {
  return (
    <DataTable<PersonWithBio>
      aria-label="作曲家(动态行高)"
      columns={columns}
      dynamicRowHeight
      items={people}
      maxHeight={400}
      virtualized
    />
  )
}
