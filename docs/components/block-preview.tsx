import type { ReactElement } from 'react'
import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { ComponentPreviewTabs } from '@/components/component-preview-tabs'
import { ComponentSource } from '@/components/component-source'
import { DemoRenderer } from '@/demos'

/**
 * 整页 block 的展示卡:`<BlockPreview name="blocks/sidebar-07" />`。
 * 预览跑 registry 里同名的 demo(入口是目录下的 page.tsx);展开源码时
 * 列出整个目录——block 的价值在 components/ 里,只给入口文件等于没给。
 */
export async function BlockPreview({ name }: { name: string }): Promise<ReactElement> {
  const dir = path.join(process.cwd(), 'demos', name)
  const files = (await fs.readdir(dir, { recursive: true }))
    .filter(file => file.endsWith('.tsx'))
    .map(file => file.replace(/\.tsx$/, '').split(path.sep).join('/'))
    // 入口在前,其余按路径
    .sort((a, b) => Number(b === 'page') - Number(a === 'page') || a.localeCompare(b))

  return (
    <ComponentPreviewTabs
      align="stretch"
      previewClassName="p-0! block-auto"
      component={<DemoRenderer name={name} />}
      source={(
        <div className="flex flex-col">
          {files.map(file => (
            <div key={file}>
              <div className="
                border-bs bg-muted/40 px-4 py-2 font-mono text-xs
                text-muted-foreground
              "
              >
                {`${file}.tsx`}
              </div>
              <ComponentSource name={`${name}/${file}`} />
            </div>
          ))}
        </div>
      )}
      sourcePreview={<ComponentSource name={`${name}/page`} maxLines={3} />}
    />
  )
}
