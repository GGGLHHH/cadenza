import type { Script, Step } from '@gedatou/cadenza-ai/mock'
import { echo, reasoning, respond, text, tool, usage } from '@gedatou/cadenza-ai/mock'

// The same rehearsal-planning world the message-scroller demos live in, so a
// reader moving between pages meets one story. Everything here is Markdown the
// scripted transport streams back; no key, no network.
export const REPLIES = {
  plan: `Ravel's **Pavane** opens; *La Mer* follows; the interval comes after it.

- Pavane — 6 min
- La Mer — 24 min
- Interval — 20 min
- Firebird — 21 min

Curtain down before ten if the downbeat is on time.`,
  table: `| Work | Minutes | Section |
| --- | ---: | --- |
| Pavane | 6 | strings, winds |
| La Mer | 24 | full |
| Firebird | 21 | full + harps |`,
  // Display math only: streamdown keeps single-dollar inline math off by default
  // (a "$20 ticket" in a chat reply must not turn into a formula).
  math: `Total music is 6 + 24 + 21 = 51 minutes, so with a 20-minute interval the evening runs

$$T = 51 + 20 = 71\\ \\text{minutes}$$

and the curtain is down by

$$19{:}30 + 71\\,\\text{min} + 20\\,\\text{min settle} \\approx 21{:}00$$`,
  code: `\`\`\`ts
const programme = ['Pavane', 'La Mer', 'Firebird']
const interval = { after: 'La Mer', minutes: 20 }
\`\`\``,
  long: Array.from({ length: 12 }, (_, i) => `Paragraph ${i + 1}: the section leaders should hear the running order before the dress rehearsal, so nobody discovers a change on the night.`).join('\n\n'),
}

/** The hero flow: think → tool → Markdown → usage. */
export function planningReply(): Step[] {
  return [
    reasoning('The hall prefers the loudest work last, and the harps should move once.'),
    tool('get_time', { tz: 'Europe/Paris' }, { output: { iso: '2026-10-14T19:30:00+02:00' } }),
    text(REPLIES.plan),
    usage({ inputTokens: 412, outputTokens: 96 }),
  ]
}

/** What most demos answer with: a small router over the last user message. */
export function rehearsalScript(): Script {
  return respond([
    [/table/i, [text(REPLIES.table)]],
    [/math|minutes/i, [text(REPLIES.math)]],
    [/code/i, [text(REPLIES.code)]],
    [/slow|long/i, [text(REPLIES.long, { chunk: 'char', pace: 8 })]],
    [/plan|programme|program/i, planningReply()],
  ], echo())
}
