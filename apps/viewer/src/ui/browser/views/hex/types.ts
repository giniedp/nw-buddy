export interface HexModeState {
  /**
   * The file could not be read
   */
  readonly loadError: string | null
  /**
   * The bytes are read
   */
  readonly ready: boolean
  /**
   * The size of the file, e.g. `1.5 KiB (1,536 bytes)`
   */
  readonly size: string
}
