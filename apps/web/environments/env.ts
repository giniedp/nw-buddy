declare const __VERSION__: string
declare const __NW_USE_PTR__: boolean
declare const __NW_DATA_URL__: string
declare const __NW_DEPLOY_URL__: string

export const env = {
  /**
   * The build version string
   */
  version: __VERSION__,
  /**
   * Whether this is a New World PTR build
   */
  isPTR: __NW_USE_PTR__,
  /**
   * The path where datasheets are located
   */
  nwDataUrl: __NW_DATA_URL__,
  /**
   * The deploy URL for assets and resources
   */
  deployUrl: __NW_DEPLOY_URL__,
  /**
   * Whether this is a standalone build (electron, overwolf)
   */
  standalone: false
}
