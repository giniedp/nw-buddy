/**
 * Download status of an action: progress while it runs, the error when it failed. Nothing after a download.
 */
export interface DownloadState {
  busy: boolean
  text: string
  error: boolean
}

export interface ExportGroupsState {
  /**
   * The status of each running or failed action, by its id
   */
  downloads: Record<string, DownloadState | undefined>
}
