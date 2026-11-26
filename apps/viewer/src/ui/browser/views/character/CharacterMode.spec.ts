import { describe, expect, it } from 'vitest'
import { clipCount } from './format'
import { defaultSettings, parseSettings } from './settings'

describe('parseSettings', () => {
  it('falls back to the defaults', () => {
    expect(parseSettings(null)).toEqual(defaultSettings())
    expect(parseSettings('42')).toEqual(defaultSettings())
  })

  it('keeps stored values over the defaults', () => {
    const stored = { list: 'fragments', speed: 0.5, databases: { 'a.cdf': 'x.adb' } }
    expect(parseSettings(JSON.stringify(stored))).toEqual({ ...defaultSettings(), ...stored })
  })

  it('shows the fragments for an unknown list', () => {
    expect(parseSettings(JSON.stringify({ list: 'attachments' })).list).toBe('fragments')
  })

  it('keeps a positive list width only', () => {
    expect(parseSettings(JSON.stringify({ listWidth: 320 })).listWidth).toBe(320)
    expect(parseSettings(JSON.stringify({ listWidth: 0 })).listWidth).toBeNull()
    expect(parseSettings(JSON.stringify({ listWidth: '320' })).listWidth).toBeNull()
  })

  it('does not share the defaults', () => {
    parseSettings(null).databases['a.cdf'] = 'x.adb'
    expect(parseSettings(null).databases).toEqual({})
  })
})

describe('clipCount', () => {
  it('counts animations', () => {
    expect(clipCount(1)).toBe('1 animation')
    expect(clipCount(3)).toBe('3 animations')
  })
})
