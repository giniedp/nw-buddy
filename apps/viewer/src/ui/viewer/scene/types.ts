export interface SceneBrowserState {
  /**
   * The engine has created its scene
   */
  readonly hasScene: boolean
  /**
   * The ids of the expanded nodes
   */
  expanded: ReadonlySet<string>
  /**
   * The id of the selected node
   */
  readonly selectedId: string | null
  /**
   * Counts up every second: the children change in the engine, e.g. while a level streams in
   */
  readonly version: number
}
