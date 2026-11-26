import { describe, expect, it } from 'vitest'
import { wwiseShortId, type WwiseBank } from '../wwise'
import { bankContents, mediaFileName, streamedMediaFolder } from './media'

const SFX = wwiseShortId('SFX')
const ENGLISH = wwiseShortId('English(US)')

describe('streamedMediaFolder', () => {
  it('streams SFX banks from the media folder of the root', () => {
    expect(streamedMediaFolder('sounds/wwise/ambiences.bnk', SFX)).toBe('sounds/wwise/media')
    expect(streamedMediaFolder('sounds/wwise/minspec/ambiences.bnk', SFX)).toBe('sounds/wwise/media')
  })

  it('streams language banks from the folder of their language', () => {
    expect(streamedMediaFolder('localization/sounds/wwise/english(us)/charactervo.bnk', ENGLISH)).toBe(
      'localization/sounds/wwise/media/english(us)',
    )
  })

  it('knows no folder for other layouts', () => {
    expect(
      streamedMediaFolder('localization/sounds/wwise/english(us)/charactervo.bnk', wwiseShortId('Italian')),
    ).toBeNull()
    expect(streamedMediaFolder('music/x.bnk', SFX)).toBeNull()
  })
})

describe('bankContents', () => {
  it('lists embedded media, and a bank without objects has no streamed ones', () => {
    const bank: WwiseBank = {
      version: 150,
      id: 1,
      languageId: SFX,
      bytes: new Uint8Array(),
      media: new Map([
        [10, { id: 10, offset: 0, size: 100 }],
        [11, { id: 11, offset: 100, size: 50 }],
      ]),
      hirc: [],
    }
    const names = new Map([[11, ['Play_A', 'Play_B']]])
    expect(bankContents(bank, 'sounds/wwise/x.bnk', names)).toEqual({
      media: [
        { id: 10, kind: 'embedded', size: 100, path: null, events: [] },
        { id: 11, kind: 'embedded', size: 50, path: null, events: ['Play_A', 'Play_B'] },
      ],
      external: 0,
      unparsed: 0,
    })
  })
})

describe('mediaFileName', () => {
  it('names a file by id and the first event name', () => {
    expect(mediaFileName({ id: 7, events: ['Play_Wpn_GroundHit', 'Play_X'] }, 'wav')).toBe('7_Play_Wpn_GroundHit.wav')
    expect(mediaFileName({ id: 7, events: ['Play bark: a/b'] }, 'wem')).toBe('7_Play_bark_a_b.wem')
    expect(mediaFileName({ id: 7, events: [] }, 'wav')).toBe('7.wav')
  })
})
