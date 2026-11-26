/**
 * A label / value row of the details
 */
export interface DetailRow {
  label: string
  value: string
}

export interface DetailsViewState {
  /**
   * What the archive knows about the file
   */
  readonly file: DetailRow[]
  /**
   * What the asset catalog knows about the file, null when it is not in the catalog
   */
  readonly catalog: DetailRow[] | null
  /**
   * The split parts of a texture, empty for other files
   */
  readonly parts: DetailRow[]
}
