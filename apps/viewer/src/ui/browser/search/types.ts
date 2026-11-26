export interface SearchResultsState {
  /**
   * The search could not be run
   */
  failed: boolean
  /**
   * The outcome as one line: searching, failed, the number of matches
   */
  readonly summary: string
}
