import type { BankContents } from '../../../../audio/preview'
import type { WwiseBank } from '../../../../audio/wwise'

/**
 * What the audio preview plays, shared by the audio views
 */
export interface PlaybackState {
  /**
   * Counts every change of the preview (play, stop, decode error), e.g. to refresh grid cells
   */
  changes: number
  /**
   * The key of the playing clip, null when nothing plays
   */
  key: string | null
  /**
   * The last part of the key: the file or the media id
   */
  name: string
  /**
   * Seconds of the playing clip
   */
  duration: number
  channels: number
  /**
   * Seconds played, polled
   */
  position: number
}

/**
 * A parsed `.bnk` and the media it lists
 */
export interface LoadedBank {
  bank: WwiseBank
  contents: BankContents
}

export interface AudioBankModeState {
  /**
   * The bank could not be read
   */
  readonly loadError: string | null
  /**
   * The bank is read
   */
  readonly ready: boolean
  /**
   * The bank has no media of its own
   */
  readonly empty: boolean
  /**
   * The facts of the bank as one line
   */
  readonly info: string
}

export interface AudioMediaModeState {
  /**
   * The clip is decoded
   */
  readonly ready: boolean
  /**
   * This clip plays
   */
  readonly playing: boolean
  /**
   * The played part of the clip (0 to 1), null when it does not play
   */
  readonly progress: number | null
  /**
   * Position, duration and format of the clip, or why it is not shown
   */
  readonly info: string
}
