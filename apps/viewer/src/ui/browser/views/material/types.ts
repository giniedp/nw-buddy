export interface MaterialModeState {
  /**
   * The names of the sub materials, empty while they load
   */
  names: string[]
  /**
   * The framed shader ball, null for all of them
   */
  focus: number | null
  /**
   * The number of sub materials, or that they load
   */
  readonly info: string
}
