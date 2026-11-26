import { describe, expect, it } from 'vitest'
import { partTrigger, sheetFilePath, songBankPath, songField } from './songs'

describe('songField', () => {
  it('knows the audio columns of the song book', () => {
    expect(songField('SongBookSheets', 'AudioEvent')).toBe('sheet-audio')
    expect(songField('SongBookData', 'Slot01')).toBe('song-slot')
    expect(songField('SongBookData', 'Slot05')).toBe('song-slot')
    expect(songField('SongBookData', 'SoundBank')).toBe('song-bank')
    expect(songField('SongBookSheets', 'SheetId')).toBe('sheet-file')
  })

  it('leaves the other columns and families alone', () => {
    expect(songField('SongBookData', 'Crowd')).toBeNull()
    expect(songField('SongBookSheets', 'Timeline')).toBeNull()
    expect(songField('MasterItemDefinitions', 'AudioEvent')).toBeNull()
  })
})

describe('song audio', () => {
  it('makes the Wwise event of a part and the bank path of a song', () => {
    expect(partTrigger('AG_MAUDLINBUG_MELODY_120')).toBe('Play_MXMI_AG_MAUDLINBUG_MELODY_120')
    expect(songBankPath('MXMI_Maudlinbug_Melody')).toBe('sounds/wwise/mxmi_maudlinbug_melody.bnk')
    expect(sheetFilePath('Waltz_Guitar_Part1_Easy')).toBe(
      'sharedassets/musicsheets/waltz_guitar_part1_easy.musicsheetc',
    )
  })
})
