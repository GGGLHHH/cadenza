import type { ReactElement } from 'react'
import { Button, ColorPicker } from '@gedatou/cadenza-ui'
import { useState } from 'react'

// 有 name 才渲染隐藏 input;不透明的值序列化成 #rrggbb,带透明度的序列化成
// 8 位 hex。提交只为把 FormData 里的值捞出来看
export default function FormDemo(): ReactElement {
  const [submitted, setSubmitted] = useState<string | null>(null)
  return (
    <form
      className="flex items-center gap-3"
      onSubmit={(event) => {
        event.preventDefault()
        setSubmitted(new FormData(event.currentTarget).get('accent') as string)
      }}
    >
      <ColorPicker aria-label="强调色" defaultValue="#6366f180" name="accent" />
      <Button size="sm" type="submit" variant="outline">提交</Button>
      {submitted !== null && (
        <span className="font-mono text-xs text-muted-foreground">{submitted}</span>
      )}
    </form>
  )
}
