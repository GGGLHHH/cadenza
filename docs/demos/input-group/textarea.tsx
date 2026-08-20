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

// block-end: the addon spans the full row and sits below; InputGroup
// switches from one row to a vertical layout automatically.
// Use block-start to place it above instead
export default function TextareaDemo(): ReactElement {
  const [value, setValue] = useState('')

  return (
    <div className="inline-full max-inline-md">
      <InputGroup>
        <InputGroupTextarea
          aria-label="Message"
          placeholder="Write something..."
          rows={3}
          value={value}
          onChange={event => setValue(event.target.value)}
        />
        <InputGroupAddon align="block-end">
          <InputGroupButton aria-label="Add attachment" size="icon-xs">
            <IconPaperclip aria-hidden />
          </InputGroupButton>
          <InputGroupText className="ms-auto">
            {`${value.length} / 500`}
          </InputGroupText>
          <InputGroupButton disabled={value.trim() === ''} variant="default">
            Send
            <IconSend aria-hidden />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
  )
}
