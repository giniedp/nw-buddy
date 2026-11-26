export interface LocModeState {
  /**
   * The file could not be read
   */
  readonly loadError: string | null
  /**
   * The strings are read
   */
  readonly ready: boolean
  /**
   * The number of strings, e.g. `1,234 strings`
   */
  readonly count: string
  /**
   * The characters of the longest key, for the width of the key column
   */
  readonly keyChars: number
}
