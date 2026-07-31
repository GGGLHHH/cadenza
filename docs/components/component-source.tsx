import type { ReactElement } from 'react'
import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { CodeScrollArea } from '@/components/code-scroll-area'
import { CopyButton } from '@/components/copy-button'
import { highlightCode } from '@/lib/highlight-code'
import { cn } from '@/lib/utils'

/**
 * 读 demos/<name>.tsx 的真实源码并高亮——展示的代码与运行的 demo 同一个文件,
 * 永不失同步(shadcn 走 registry 构建产物,我们直接读文件,少一层基建)。
 */
export async function ComponentSource({
  name,
  maxLines,
  className,
}: {
  name: string
  /** 只展示前 N 行(折叠态的 3 行预览) */
  maxLines?: number
  className?: string
}): Promise<ReactElement> {
  const file = path.join(process.cwd(), 'demos', `${name}.tsx`)
  const code = (await fs.readFile(file, 'utf-8')).trimEnd()

  const display = maxLines === undefined
    ? code
    : code.split('\n').slice(0, maxLines).join('\n')
  const highlighted = await highlightCode(display)

  return (
    <div className={cn('relative', className)}>
      <figure data-rehype-pretty-code-figure="">
        {/* 复制按钮是 ScrollArea 的兄弟,锚在 figure 上:不随滚动、不被 fade 遮 */}
        <CopyButton value={code} />
        <CodeScrollArea>
          {/* shiki 构建期输出,非用户输入 */}
          {/* eslint-disable-next-line react/dom-no-dangerously-set-innerhtml */}
          <div dangerouslySetInnerHTML={{ __html: highlighted }} />
        </CodeScrollArea>
      </figure>
    </div>
  )
}
