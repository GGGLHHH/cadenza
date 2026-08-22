import { useCallback, useEffect, useRef, useState } from 'react'

export interface ChatMessage {
  id: string
  role: 'assistant' | 'user'
  content: string
}

// Mock transcript: a rehearsal-planning thread. Turn lengths deliberately match
// the scale of shadcn's own demo data (~130 chars asking, ~350-450 answering).
// An anchored turn only reads well when the reply below it can fill the
// viewport; with one-line replies the scroller has to pad the room out with its
// spacer instead, and the transcript looks stranded at the top.

const THREAD: [string, string][] = [
  [
    'We need an opening piece for the October concert. Something short that settles the hall, and it has to leave room for the Stravinsky after the interval.',
    'Ravel\'s Pavane pour une infante défunte runs about six minutes and settles a hall better than almost anything else in the repertoire. It asks nothing of the brass, which gives them time to warm properly before the Rite, and its harmonic language sits close enough to Debussy that the whole first half reads as one idea rather than three unrelated pieces stapled together. It is also the one piece on the shortlist the section already knows, which given a single rehearsal is worth more than any argument about programming.',
  ],
  [
    'Does that actually leave room for the Rite, or are we going to run past ten again like we did in March?',
    'It fits, with room to spare. The Rite of Spring is thirty-three minutes, so a six-minute opener plus a twenty-minute interval lands the evening at seventy-one minutes of music and just under two hours in the hall. March ran long because the second half had two encores nobody had scheduled — the programme itself was never the problem. If you want the margin back, the interval is the place to find it — nineteen minutes is still long enough for the bar and buys you a full minute of slack.',
  ],
  [
    'What about the strings? We are two cellists short for that week and I have not found anyone to cover.',
    'The Pavane survives a thin cello section; it is scored so the line can be carried by four players without sounding hollow. The Rite cannot. Its opening sits over divided cellos, and the Danse sacrale needs real weight underneath or the final section turns papery. With two players missing I would not programme it at all rather than programme it badly. Ask the two of them again this week; if nobody turns up by Friday we should treat the Rite as off the table and stop planning around a section we do not have.',
  ],
  [
    'Could we swap the Rite for something Debussy, then? Same period, same audience, less strain on the low strings.',
    'La Mer is the natural substitute: twenty-four minutes, three movements, and it asks far less of the low strings while keeping the programme inside the same decade. It also pairs with the Pavane in a way the Rite never did — the audience hears one continuous French argument instead of a polite curtain-raiser followed by something violent. The one cost is that we lose the piece everyone was going to write about, so the programme note has to work harder than it would have done otherwise.',
  ],
  [
    'Where does the interval go if we make that change? I would rather not break up the Debussy.',
    'After La Mer, not inside it. It is the longest single work of the evening, and an interval straight after it gives the winds a genuine rest before the Firebird while letting the audience leave on the strongest thing they have heard so far. Breaking between its movements would be the one arrangement guaranteed to annoy everyone. It also means the harps only have to move once, before the Firebird, which is the difference between a clean interval and twenty minutes of furniture noise.',
  ],
  [
    'Alright. Print the running order so I can send it to the front of house tonight.',
    'Ravel, Pavane pour une infante défunte — six minutes. Debussy, La Mer — twenty-four minutes. Interval — twenty minutes. Stravinsky, Firebird Suite — twenty-one minutes. That is fifty-one minutes of music before the interval breaks it, seventy-one in total, and a curtain down comfortably before ten if you start on time. I have assumed a five-minute settle before the downbeat and no encore; if you want an encore, say so now and I will take it out of the interval rather than off the end.',
  ],
]

const EARLIER_THREAD: [string, string][] = [
  [
    'Is the hall booked for October 14, and did we ever confirm the dress rehearsal slot the evening before?',
    'Both confirmed. The hall is ours from noon on the 13th, which covers the dress rehearsal, and all day on the 14th. The stage takes ninety players comfortably, so even a full Rite orchestra would have fitted — the constraint was never the room, it was the cello section.',
  ],
  [
    'And who is conducting? I have been assuming Marta but nobody has actually asked her.',
    'Nobody has asked anyone yet. Two names are free that week and both have La Mer in their repertoire already, which matters more than it sounds — there is one rehearsal, and a conductor learning the piece on our time is a conductor we cannot afford. Marta is one of the two.',
  ],
]

function toMessages(thread: [string, string][], prefix: string): ChatMessage[] {
  return thread.flatMap(([user, assistant], turn) => [
    { id: `${prefix}-${turn}-user`, role: 'user' as const, content: user },
    { id: `${prefix}-${turn}-assistant`, role: 'assistant' as const, content: assistant },
  ])
}

/** The thread a saved conversation opens with. */
export const TRANSCRIPT: ChatMessage[] = toMessages(THREAD, 'turn')

/**
 * A group thread for the group-chat demo, where a turn does not start with
 * "the user's message" — several people talk, and what opens a turn is often a
 * marker (someone joining) rather than a message at all.
 */
export interface GroupMessage {
  id: string
  sender: string
  content: string
}

export const GROUP_TRANSCRIPT: GroupMessage[] = [
  { id: 'g-0', sender: 'Ines', content: 'Sectionals tomorrow are at three, not four — the hall swapped us with the choir. Strings in the main room, winds upstairs.' },
  { id: 'g-1', sender: 'Tomas', content: 'That clashes with the instrument delivery. Someone has to be downstairs at three to sign for the timpani or they take them back to the depot.' },
  { id: 'g-2', sender: 'Ines', content: 'I can sign for them. Start without me and I will come up once the crates are in — it should not take more than ten minutes.' },
  { id: 'g-3', sender: 'Tomas', content: 'Works. I will take the first run-through of the Debussy so the winds are not standing around waiting for a downbeat.' },
  { id: 'g-4', sender: 'Ines', content: 'Perfect. And can someone check whether the second harp is still tuned? It was left on stage overnight after the recording session.' },
  { id: 'g-5', sender: 'Tomas', content: 'I will look before we start. If it has drifted badly there is no time to fix it tomorrow, so we would need to know tonight rather than at three.' },
]

/** The people the group-chat demo can drop into the room, in order. */
export const JOINERS = ['Marcus', 'Rocky', 'Yuki'] as const

/** What each of them says once they arrive. */
export const JOINER_LINES: Record<string, string> = {
  Marcus: 'Just caught up on the thread. I can cover the timpani delivery if Ines would rather start the sectional on time — I am in the building from two anyway.',
  Rocky: 'Second harp was fine when I locked up, but the room got cold overnight. Worth ten minutes with a tuner before anyone plays on it.',
  Yuki: 'I can bring the tuner. Also: the choir left their risers on stage left, so we have less room than the seating plan assumes.',
}

/** Older rows, prepended above the transcript by the load-history demo. */
export const EARLIER: ChatMessage[] = toMessages(EARLIER_THREAD, 'earlier')

const REPLIES = [
  'Programme updated. The evening still ends before ten, the winds keep their rest after La Mer, and front of house has the same interval length they had last season so the bar staffing does not need rewriting. I have left the Firebird where it was — moving it earlier would put the loudest work before the interval, which the hall has asked us twice not to do. Front of house have the running order already, so if anything moves again it needs to move today rather than at the dress rehearsal.',
  'Noted, and it costs less than you would think: four minutes, which the interval can absorb without moving the curtain. The only knock-on is that the brass now sit idle for longer between their two entries, so I would warn them rather than let them discover it in the dress rehearsal. Everything else holds: same interval, same curtain, same stage plot, and the harps still only move once. I have marked the change in the score library copy so the parts match what we actually play.',
  'That works for the strings and it also puts the loudest work last, which is what the hall prefers. One caveat worth raising with the section leaders: the new order means the cellos play continuously for the last thirty minutes with no rest at all, and with two players missing that is a real question rather than a theoretical one. Worth putting to the section leaders before we commit — if they say it is unplayable as ordered, the fix is to swap the last two works, which costs nothing except a reprinted programme.',
]

/**
 * Short replies for the peek demo. A reply long enough to fill the viewport
 * hands the view back to follow-output, which overrides the anchor — and with
 * it the peek the demo is trying to show.
 */
export const SHORT_REPLIES = [
  'Done — four minutes either way, and the interval absorbs it.',
  'That works. The brass get a longer rest, nothing else moves.',
  'Fine by the strings, and the loudest work still lands last.',
]

/**
 * Appends a user message, then streams a reply into it word by word — the
 * shape `autoScroll` is built for: content grows while the reader may be
 * anywhere in the transcript.
 */
export function useFakeChat(
  initial: ChatMessage[] = TRANSCRIPT,
  replies: string[] = REPLIES,
): {
  messages: ChatMessage[]
  streaming: boolean
  send: (text: string) => void
} {
  const [messages, setMessages] = useState(initial)
  const [streaming, setStreaming] = useState(false)
  const timerRef = useRef<number | undefined>(undefined)
  const sentRef = useRef(0)

  useEffect(() => () => window.clearInterval(timerRef.current), [])

  const send = useCallback((text: string) => {
    const turn = sentRef.current++
    const replyId = `sent-${turn}-assistant`
    const words = (replies[turn % replies.length] ?? '').split(' ')

    setMessages(current => [
      ...current,
      { id: `sent-${turn}-user`, role: 'user', content: text },
      { id: replyId, role: 'assistant', content: '' },
    ])
    setStreaming(true)

    let word = 0
    window.clearInterval(timerRef.current)
    timerRef.current = window.setInterval(() => {
      if (word >= words.length) {
        window.clearInterval(timerRef.current)
        setStreaming(false)
        return
      }
      const next = words[word++]
      setMessages(current => current.map(message => (
        message.id === replyId
          ? { ...message, content: `${message.content}${message.content ? ' ' : ''}${next}` }
          : message
      )))
    }, 45)
  }, [replies])

  return { messages, streaming, send }
}
