export type EnvVars = typeof env

export const env = {
  /**
   * The build version string
   */
  version: 'v0',
  /**
   * Whether the environment is PTR
   * @remarks
   * used to determine nwdb tooltip and link target
   */
  isPTR: false,
  /**
   * Floating badge text above Site name
   */
  badge: '',
  /**
   * nw-data workspace folder
   */
  workspace: 'live',
  /**
   * The branch name (used to determine cdn asset path)
   */
  branchname: 'live',
  /**
   * The path where models are located
   */
  cdnUrl: 'https://cdn.nw-buddy.de',
  /**
   * The deploy URL for assets and resources
   */
  deployUrl: '/',
  /**
   * Whether nwdb.info tooltips should be disabled
   */
  disableTooltips: false,
  /**
   * A watermark image URL
   */
  watermarkImageUrl: '',

  /**
   * New world buddy tools url
   * @remarks
   * only for local development
   */
  nwbtUrl: 'http://localhost:8000',

  pocketbaseUrl: '',

}
