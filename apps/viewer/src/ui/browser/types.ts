export interface BrowserToolState {
  /**
   * The selected folder of the tree (without a trailing `/`), null when a file or nothing is selected
   */
  folder: string | null
  /**
   * The search text, empty shows the tree
   */
  query: string
  /**
   * The `key` of each asset type of the filter: the type indices depend on the type list of the server
   */
  filterKeys: string[]
  /**
   * The selection as the tree marks it: a file path, or a folder path with a trailing `/`
   */
  readonly selectedPath: string | null
}
