export interface ViewerOverlayState {
  /**
   * The left sidebar: the scene tree
   */
  left: boolean
  /**
   * The right sidebar: the stats
   */
  right: boolean
  /**
   * The minimap of the level, top left above the canvas
   */
  map: boolean
  /**
   * The audio of the viewer config
   */
  readonly audio: boolean
  /**
   * The game clock is paused or fixed (shaders, particles, fog volumes stand still)
   */
  readonly clockFrozen: boolean
  /**
   * The time of the game clock in seconds, two decimals: where a frozen clock stands
   */
  readonly clockTime: string
}
