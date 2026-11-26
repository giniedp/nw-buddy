import { describe, expect, it } from 'vitest'
import { cutNotice, cutText } from './CodeMode.store'
import { languageOf } from './sources'

describe('cutText', () => {
  it('keeps a text up to the limit', () => {
    expect(cutText('abc', 3)).toEqual({ text: 'abc', size: 3 })
  })

  it('cuts a longer text and keeps its size', () => {
    const it = cutText('abcdef', 4)
    expect(it).toEqual({ text: 'abcd', size: 6 })
    expect(cutNotice(it)).toMatch(/^Showing the first .+ of .+\.$/)
  })

  it('has no notice for a whole text', () => {
    expect(cutNotice(cutText('abc', 3))).toBe('')
  })
})

describe('languageOf', () => {
  it('goes by the extension', () => {
    expect(languageOf('a/b.json', '')).toBe('json')
    expect(languageOf('a/b.lua', '')).toBe('lua')
    expect(languageOf('game.cfg', '')).toBe('ini')
    expect(languageOf('a/b.ini', '')).toBe('ini')
    expect(languageOf('a/b.xml', 'not a tag')).toBe('xml')
  })

  it('takes text that starts with a tag as xml', () => {
    expect(languageOf('a/b.mtl', '<Material/>')).toBe('xml')
    expect(languageOf('a/b.cdf', '﻿  \n<CharacterDefinition>')).toBe('xml')
    expect(languageOf('a/b.txt', 'hello <b>')).toBe('plaintext')
  })
})
