import { describe, expect, it } from 'vitest'
import type { BankMedia } from '../../../../audio/preview'
import { wwiseShortId, type WwiseBank } from '../../../../audio/wwise'
import { describeBank, languageName } from './AudioBankMode.store'

const media = (kind: BankMedia['kind'], events: string[] = []): BankMedia => ({
  id: 1,
  kind,
  size: 0,
  path: null,
  events,
})

describe('languageName', () => {
  it('names SFX banks', () => {
    expect(languageName(wwiseShortId('SFX'), 'sounds/wwise/a.bnk')).toBe('SFX')
  })

  it('names a language bank by its folder', () => {
    const id = wwiseShortId('English(US)')
    expect(languageName(id, 'sounds/wwise/English(US)/vo.bnk')).toBe('English(US)')
    expect(languageName(id, 'sounds/wwise/vo.bnk')).toBe(`language ${id}`)
  })
})

describe('describeBank', () => {
  const bank = { id: 7, version: 150, languageId: wwiseShortId('SFX') } as WwiseBank

  it('counts embedded, streamed and named media', () => {
    const contents = {
      media: [media('embedded', ['Play_a']), media('embedded'), media('streamed', ['Play_b'])],
      external: 0,
      unparsed: 0,
    }
    expect(describeBank({ bank, contents }, 'sounds/wwise/a.bnk')).toBe(
      'bank 7 · v150 · SFX · 2 embedded, 1 streamed, 2 named',
    )
  })

  it('tells media in other banks and unreadable objects', () => {
    const contents = { media: [], external: 3, unparsed: 2 }
    expect(describeBank({ bank, contents }, 'sounds/wwise/a.bnk')).toBe(
      'bank 7 · v150 · SFX · 0 embedded, 0 streamed, 0 named · 3 in other banks · 2 objects not readable (v150)',
    )
  })
})
