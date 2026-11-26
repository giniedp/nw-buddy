export interface GameEntityPropsState {
  readonly name: string
  /**
   * The activation state of the entity, polled: the activation runs in the engine and may complete later
   */
  readonly stateName: string
  readonly active: boolean
  /**
   * The number of active components
   */
  readonly componentCount: number
}

/**
 * A game file of an entity, with the actions of the browser
 */
export interface SourceFile {
  label: string
  path: string
  /**
   * The material to export a model with
   */
  material?: string
}
