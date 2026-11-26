import { FxaaPass, TonemapPass, type RenderPass } from '@gglib/render'
import { describe, expect, it } from 'vitest'
import { PASS_FIELDS, passFieldsOf } from './passFields'
import { formatTimes } from './PassTimer.store'

describe('passFieldsOf', () => {
  class Base {}
  class Child extends Base {}
  const views = [
    { type: Child as any, fields: () => null },
    { type: Base as any, fields: () => null },
  ]

  it('takes the first view the pass is an instance of', () => {
    expect(passFieldsOf(views, new Child() as unknown as RenderPass)).toBe(views[0])
    expect(passFieldsOf(views, new Base() as unknown as RenderPass)).toBe(views[1])
  })

  it('is undefined for passes without fields', () => {
    expect(passFieldsOf(views, {} as RenderPass)).toBeUndefined()
  })

  it('has one view per pass type', () => {
    const types = PASS_FIELDS.map((it) => it.type)
    expect(new Set(types).size).toBe(types.length)
    expect(types).toContain(FxaaPass)
    expect(types).toContain(TonemapPass)
  })
})

describe('formatTimes', () => {
  it('shows the last, average and max time with two decimals', () => {
    expect(formatTimes({ time: 1.234, average: 0.5, max: 12 })).toBe('1.23 avg 0.50 max 12.00')
  })

  it('is empty without a timer', () => {
    expect(formatTimes(null)).toBe('')
  })
})
