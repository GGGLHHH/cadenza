import { describe, expect, it } from 'vitest'
import { fieldErrorId, normalizeFieldErrors } from '../src'

describe('normalizeFieldErrors', () => {
  it('字符串错误包装成 { message }', () => {
    expect(normalizeFieldErrors(['必填'])).toEqual([{ message: '必填' }])
  })

  it('递归拍平嵌套数组', () => {
    expect(normalizeFieldErrors([['a', ['b']], 'c'])).toEqual([
      { message: 'a' },
      { message: 'b' },
      { message: 'c' },
    ])
  })

  it('带 message 的对象只保留 message（zod issue 形状）', () => {
    expect(normalizeFieldErrors([{ message: '太短', code: 'too_small' }])).toEqual([
      { message: '太短' },
    ])
  })

  it('无 message 的值静默丢弃', () => {
    expect(normalizeFieldErrors([null, undefined, 42, { code: 'x' }])).toEqual([])
  })
})

describe('fieldErrorId', () => {
  it('清洗非法字符后拼 -error 后缀', () => {
    expect(fieldErrorId('user.name')).toBe('user-name-error')
    expect(fieldErrorId('plain')).toBe('plain-error')
  })
})
