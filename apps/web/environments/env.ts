import { isDevMode } from '@angular/core'

export const supabaseAnonKey = isDevMode()
  ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
  : ''

export const supabaseUrl = isDevMode() ? 'http://127.0.0.1:54321' : ''

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
}
