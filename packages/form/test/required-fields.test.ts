import type { AnyFieldApi, AnyFormApi } from '../src'
import { describe, expect, it } from 'vitest'
import { fieldControlProps, requiredFields } from '../src'

// 协议级测试:不引 zod,手写最小 Standard Schema —— 对 emptyValues 出 issue
// 的字段路径即必填集合,路径格式与 tanstack 字段名一致
function schemaWithIssues(
  issues: { path?: readonly (PropertyKey | { key: PropertyKey })[] }[],
): Parameters<typeof requiredFields>[0] {
  return { '~standard': { validate: () => ({ issues }) } }
}

describe('requiredFields', () => {
  it('顶层路径直接成名', () => {
    const required = requiredFields(
      schemaWithIssues([{ path: ['name'] }, { path: ['voicePart'] }]),
      {},
    )
    expect(required).toEqual(new Set(['name', 'voicePart']))
  })

  it('数字段用方括号、后续字符串段用点号:emails[0].address', () => {
    const required = requiredFields(
      schemaWithIssues([{ path: ['emails', 0, 'address'] }, { path: ['emails'] }]),
      {},
    )
    expect(required.has('emails[0].address')).toBe(true)
    expect(required.has('emails')).toBe(true)
  })

  it('pathSegment 对象形态({ key })同样解析', () => {
    const required = requiredFields(
      schemaWithIssues([{ path: [{ key: 'profile' }, { key: 0 }, { key: 'bio' }] }]),
      {},
    )
    expect(required.has('profile[0].bio')).toBe(true)
  })

  it('空值合法时返回空集合', () => {
    const required = requiredFields(schemaWithIssues([]), {})
    expect(required.size).toBe(0)
  })

  it('异步 schema 抛错', () => {
    const asyncSchema = {
      '~standard': { validate: async () => ({ issues: [] }) },
    } as unknown as Parameters<typeof requiredFields>[0]
    expect(() => requiredFields(asyncSchema, {})).toThrow('synchronous')
  })
})

describe('fieldControlProps 的 aria-required', () => {
  function richField(form: AnyFormApi, name: string): AnyFieldApi {
    return {
      form,
      name,
      state: { meta: { errors: [], isDirty: false, isBlurred: false } },
    } as unknown as AnyFieldApi
  }

  it('validators 是纯函数/异步 schema 时静默无 aria-required,不抛', () => {
    const fnForm = {
      options: { defaultValues: {}, validators: { onChange: () => undefined } },
      state: { submissionAttempts: 0 },
    } as unknown as AnyFormApi
    expect('aria-required' in fieldControlProps(richField(fnForm, 'x'))).toBe(false)

    const asyncForm = {
      options: {
        defaultValues: {},
        validators: { onChange: { '~standard': { validate: async () => ({ issues: [] }) } } },
      },
      state: { submissionAttempts: 0 },
    } as unknown as AnyFormApi
    expect('aria-required' in fieldControlProps(richField(asyncForm, 'x'))).toBe(false)
  })

  it('每个 form 实例只探针一次(缓存)', () => {
    let calls = 0
    const form = {
      options: {
        defaultValues: {},
        validators: { onChange: { '~standard': { validate: () => {
          calls += 1
          return { issues: [{ path: ['a'] }] }
        } } } },
      },
      state: { submissionAttempts: 0 },
    } as unknown as AnyFormApi
    fieldControlProps(richField(form, 'a'))
    fieldControlProps(richField(form, 'b'))
    fieldControlProps(richField(form, 'a'))
    expect(calls).toBe(1)
  })

  it('必填字段带 aria-required: true,可选字段不带该属性', () => {
    const form = {
      options: {
        defaultValues: { name: '', bio: '' },
        validators: { onChange: { '~standard': { validate: () => ({ issues: [{ path: ['name'] }] }) } } },
      },
      state: { submissionAttempts: 0 },
    } as unknown as AnyFormApi

    expect(fieldControlProps(richField(form, 'name'))['aria-required']).toBe(true)
    expect('aria-required' in fieldControlProps(richField(form, 'bio'))).toBe(false)
  })
})
