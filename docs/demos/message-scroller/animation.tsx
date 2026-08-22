import type { ReactElement } from 'react'
import {
  Button,
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
  Select,
} from '@gedatou/cadenza-ui'
import { motion, useReducedMotion } from 'motion/react'
import { useState } from 'react'
import { MessageRow } from './message-row'
import { ResettableDemo } from './resettable'
import { TRANSCRIPT, useFakeChat } from './transcript'

// A motion version of the row, with messageId and scrollAnchor still on it —
// that is the whole point: wrapping the item must not cost it its identity,
// or the scroller can no longer anchor or address the row.
const MotionMessageScrollerItem = motion.create(MessageScrollerItem)

const PRESET_LABELS = {
  'fade': 'Fade',
  'slide-up': 'Slide up',
  'pop': 'Pop',
  'blur-fade': 'Blur fade',
}

const PRESETS: Record<string, Record<string, number | string>> = {
  'fade': { opacity: 0 },
  'slide-up': { opacity: 0, y: 10 },
  'pop': { opacity: 0, scale: 0.94, y: 6 },
  'blur-fade': { opacity: 0, filter: 'blur(4px)', y: 6 },
}

const PROMPTS = [
  'Move the Firebird before the interval.',
  'Can the Pavane open the second half instead?',
  'How long does that make the first half?',
]

// Entrances ride transform, opacity and filter — never height, margin or
// padding, which would fight the scroller while it measures rows to decide
// where to stop. Only the sent row animates; the reply streams into an
// ordinary row below it. Note the provider takes no autoScroll: the view
// stays put during streaming because the spacer shrinks as the reply grows
function AnimationBody(): ReactElement {
  const { messages, send } = useFakeChat()
  const [preset, setPreset] = useState('slide-up')
  const [sent, setSent] = useState(0)
  const reducedMotion = useReducedMotion()
  const original = new Set(TRANSCRIPT.map(message => message.id))

  return (
    <div className="flex flex-col gap-3 block-96">
      <div className="flex items-center gap-2">
        <Select
          aria-label="Animation preset"
          clearable={false}
          items={PRESET_LABELS}
          value={preset}
          // Select's value is `string | null` — clearing is a real state in
          // this library, and clearable={false} narrows the behaviour, not the type
          onValueChange={value => value !== null && setPreset(value)}
        />
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            const prompt = PROMPTS[sent % PROMPTS.length]
            if (prompt === undefined)
              return
            send(prompt)
            setSent(count => count + 1)
          }}
        >
          Send
        </Button>
      </div>
      <MessageScrollerProvider>
        <MessageScroller className="flex-1 rounded-xl border">
          <MessageScrollerViewport>
            <MessageScrollerContent className="gap-8 p-5">
              {messages.map((message) => {
                // Only the anchor animates. An assistant row that moved while
                // its text streamed in would be measured mid-tween.
                const animates = message.role === 'user'
                  && !original.has(message.id)
                  && reducedMotion !== true

                return (
                  <MotionMessageScrollerItem
                    animate={animates ? { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' } : undefined}
                    initial={animates ? PRESETS[preset] : false}
                    key={message.id}
                    messageId={message.id}
                    scrollAnchor={message.role === 'user'}
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
                  >
                    <MessageRow message={message} />
                  </MotionMessageScrollerItem>
                )
              })}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton />
        </MessageScroller>
      </MessageScrollerProvider>
    </div>
  )
}

export default function AnimationDemo(): ReactElement {
  return (
    <ResettableDemo>
      <AnimationBody />
    </ResettableDemo>
  )
}
