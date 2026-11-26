import { describe, expect, it } from 'vitest'
import { parseList } from './AudioSystemProps'

describe('parseList', () => {
  it('splits at commas and trims the entries', () => {
    expect(parseList(' amb_forest , music_day,x ')).toEqual(['amb_forest', 'music_day', 'x'])
  })

  it('drops empty entries', () => {
    expect(parseList('a,, ,b,')).toEqual(['a', 'b'])
  })

  it('is empty for empty text', () => {
    expect(parseList('')).toEqual([])
    expect(parseList(' , ')).toEqual([])
  })
})
