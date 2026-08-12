import type { ReactElement } from 'react'
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  createAlertDialogHandle,
} from '@gedatou/cadenza-ui'
import { useState } from 'react'

interface Track { id: string, name: string }

const INITIAL: Track[] = [
  { id: 't1', name: '夜之加斯帕' },
  { id: 't2', name: '水之嬉戏' },
  { id: 't3', name: '库普兰之墓' },
]

// 一个确认框服务整张列表:每行的触发器带着自己的 payload,root 的 children
// 写成函数就能收到。于是"正要删哪一行"根本不用变成组件状态。
const handle = createAlertDialogHandle<Track>()

export default function HandleDemo(): ReactElement {
  const [tracks, setTracks] = useState(INITIAL)

  return (
    <div className="flex flex-col gap-2 inline-full max-inline-xs">
      {tracks.map(track => (
        <div className="flex items-center justify-between gap-4" key={track.id}>
          <span className="text-sm">{track.name}</span>
          <AlertDialogTrigger
            handle={handle}
            payload={track}
            render={<Button size="sm" variant="ghost" />}
          >
            删除
          </AlertDialogTrigger>
        </div>
      ))}
      {tracks.length === 0 && <p className="text-sm text-muted-foreground">列表空了</p>}

      <AlertDialog handle={handle}>
        {({ payload: track }) => (
          <AlertDialogPopup>
            <AlertDialogHeader>
              <AlertDialogTitle>
                删除《
                {track?.name}
                》?
              </AlertDialogTitle>
              <AlertDialogDescription>这一条会从曲目表里移除,无法撤销。</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogClose render={<Button variant="outline" />}>取消</AlertDialogClose>
              <AlertDialogClose
                onClick={() => setTracks(rest => rest.filter(item => item.id !== track?.id))}
                render={<Button variant="destructive" />}
              >
                删除
              </AlertDialogClose>
            </AlertDialogFooter>
          </AlertDialogPopup>
        )}
      </AlertDialog>
    </div>
  )
}
