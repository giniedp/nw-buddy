export interface ModelModeState {
  /**
   * The highest level of detail of the model, 0 when it has none
   */
  maxLevel: number
  /**
   * The level the engine renders, polled
   */
  rendered: number
  /**
   * The level the user forced, null renders by the distance to the camera
   */
  forced: number | null
  /**
   * The levels the toolbar offers, 0 to `maxLevel`
   */
  readonly levels: number[]
  /**
   * The rendered level, or that the model has none
   */
  readonly info: string
}
