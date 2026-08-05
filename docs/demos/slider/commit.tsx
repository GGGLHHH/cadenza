import type { ReactElement } from 'react'
import { Field, FieldDescription, FieldTitle, Slider } from '@gedatou/cadenza-ui'
import { useState } from 'react'

// 两个回调各管各的:
// onValueChange 拖动过程中一路在响(reason 是 'drag'),它是可 cancel 的变更事件;
// onValueCommitted 只在这一下手势落定后响一次,是个通知,没有 cancel()。
// 昂贵的那件事(请求、写库、重算)挂在后者上。
export default function CommitDemo(): ReactElement {
  const [live, setLive] = useState(40)
  const [committed, setCommitted] = useState(40)
  const [saves, setSaves] = useState(0)

  return (
    <Field className="max-inline-sm">
      <FieldTitle id="slider-commit-quality">导出码率</FieldTitle>
      <Slider
        aria-labelledby="slider-commit-quality"
        onValueChange={next => setLive(next)}
        onValueCommitted={(next) => {
          setCommitted(next)
          // 这里才是该发请求的地方
          setSaves(count => count + 1)
        }}
        value={live}
      />
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-muted-foreground">拖动中(onValueChange)</div>
          <div className="font-medium tabular-nums">{live}</div>
        </div>
        <div>
          <div className="text-muted-foreground">落定(onValueCommitted)</div>
          <div className="font-medium tabular-nums">{committed}</div>
        </div>
      </div>
      <FieldDescription>
        已落定
        {' '}
        {saves}
        {' '}
        次 —— 拖一整趟只算一次,键盘每按一下算一次。
      </FieldDescription>
    </Field>
  )
}
