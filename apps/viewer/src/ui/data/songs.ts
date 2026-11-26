import type { Datasheets } from './families'
import { namedText } from './families'

/**
 * The songs of the musical performances: the audio of an instrument part is a Wwise event of the song's bank.
 *
 * - `SongBookData`: a song, `SoundBank` names its bank (`sounds/wwise/<soundbank>.bnk`), `Slot01`…`Slot05` its sheets
 * - `SongBookSheets`: an instrument part, its track is the event `Play_MXMI_<AudioEvent>`. The bank's `_events.bnk`
 *   has the event, the bank the media. All 435 song slots of the game resolve, each event plays one or two wem. The
 *   notes are `sharedassets/musicsheets/<sheetid>.musicsheetc` (all 436 sheets have one).
 *
 * Nothing in the values says so (the generic column inference finds no audio), so the Data tool knows these columns.
 */
export const SONG_FAMILY = 'SongBookData'
export const SHEET_FAMILY = 'SongBookSheets'

/**
 * What a song field shows besides its value:
 * - `sheet-audio`: the AudioEvent of a sheet, plays the part
 * - `song-slot`: a sheet of a song, plays the part of the sheet
 * - `song-bank`: the bank of a song, opens it in the browser
 * - `sheet-file`: the id of a sheet, opens its notes (`.musicsheetc`) in the browser
 */
export type SongField = 'sheet-audio' | 'song-slot' | 'song-bank' | 'sheet-file'

export function songField(family: string, column: string): SongField | null {
  if (family === SHEET_FAMILY && column === 'AudioEvent') {
    return 'sheet-audio'
  }
  if (family === SHEET_FAMILY && column === 'SheetId') {
    return 'sheet-file'
  }
  if (family === SONG_FAMILY && /^Slot\d+$/.test(column)) {
    return 'song-slot'
  }
  if (family === SONG_FAMILY && column === 'SoundBank') {
    return 'song-bank'
  }
  return null
}

/**
 * The Wwise event of an instrument part, from the AudioEvent of its sheet (`AG_MAUDLINBUG_MELODY_120` →
 * `Play_MXMI_AG_MAUDLINBUG_MELODY_120`, event names are case insensitive)
 */
export function partTrigger(audioEvent: string): string {
  return `Play_MXMI_${audioEvent}`
}

/**
 * The bank file of a song's SoundBank
 */
export function songBankPath(soundBank: string): string {
  return `sounds/wwise/${soundBank.toLowerCase()}.bnk`
}

/**
 * The notes file of a sheet id
 */
export function sheetFilePath(sheetId: string): string {
  return `sharedassets/musicsheets/${sheetId.toLowerCase()}.musicsheetc`
}

/**
 * The Wwise event of the part of a sheet id, null if the sheet or its AudioEvent is missing
 */
export async function sheetPartTrigger(datasheets: Datasheets, sheetId: string): Promise<string | null> {
  const rows = await datasheets.loadFamilyByName(SHEET_FAMILY)
  const row = rows?.keys.get(sheetId.toLowerCase())
  if (rows == null || row == null) {
    return null
  }
  const audioEvent = namedText(rows, row, 'AudioEvent')
  return audioEvent ? partTrigger(audioEvent) : null
}
