import type { ReactElement } from 'react'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupTextarea,
} from '@gedatou/cadenza-ui'
import { IconPaperclip, IconSend } from '@tabler/icons-react'
import { useState } from 'react'

// block-end:addon 横跨整行、排到下方,InputGroup 自动从一行变成竖向布局。
// 换成 block-start 就排到上方
export default function TextareaDemo(): ReactElement {
  const [value, setValue] = useState('')

  return (
    <div className="inline-full max-inline-md">
      <InputGroup>
        <InputGroupTextarea
          aria-label="留言"
          placeholder="写点什么..."
          rows={3}
          value={value}
          onChange={event => setValue(event.target.value)}
        />
        <InputGroupAddon align="block-end">
          <InputGroupButton aria-label="添加附件" size="icon-xs">
            <IconPaperclip aria-hidden />
          </InputGroupButton>
          <InputGroupText className="ms-auto">
            {`${value.length} / 500`}
          </InputGroupText>
          <InputGroupButton disabled={value.trim() === ''} variant="default">
            发送
            <IconSend aria-hidden />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
  )
}
