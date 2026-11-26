export interface TabViewState {
  /**
   * The file could not be read
   */
  readonly loadError: string | null
  /**
   * The file is read, its modes are known
   */
  readonly ready: boolean
  /**
   * The id of the shown mode
   */
  readonly mode: string | undefined
  /**
   * The modes shown once: they stay mounted and keep their state while another mode is shown
   */
  mounted: Record<string, boolean>
}
