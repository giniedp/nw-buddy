import type { ViewContext } from '../registry'

/**
 * Where the text of a code view comes from (the raw file or a conversion of nwbt) and its monaco language
 */
export interface TextSource {
  read(ctx: ViewContext): Promise<string>
  language(ctx: ViewContext, text: string): string
}

/**
 * A text, cut to the limit of the editor
 */
export interface LoadedText {
  text: string
  /**
   * Size of the whole text, more than `text` when it was cut
   */
  size: number
}

export interface CodeModeState {
  /**
   * The text could not be read
   */
  readonly loadError: string | null
  /**
   * The text is read
   */
  readonly ready: boolean
  /**
   * The text the editor shows
   */
  readonly text: string
  /**
   * The monaco language of the text
   */
  readonly language: string
  /**
   * Tells that the text was cut, empty when it was not
   */
  readonly notice: string
}
