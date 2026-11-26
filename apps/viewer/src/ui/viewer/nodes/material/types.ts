import type { InputSlot } from '@gglib/graphics'

/**
 * The inputs of one block of a material schema
 */
export interface InputBlock {
  name: string
  inputs: InputSlot[]
}

/**
 * The widget that edits a material input
 */
export type InputWidget = 'scalar' | 'color' | 'vector' | 'texture'

/**
 * The range of a scalar input, from the material params of the game (`material-meta.json`)
 */
export interface ScalarRange {
  min?: number
  max?: number
  step?: number
  /**
   * A slider between min and max
   */
  range: boolean
}

export interface TextureWidgetState {
  /**
   * The dialog with the texture in full size
   */
  open: boolean
  /**
   * `width x height x depth`
   */
  readonly size: string
  readonly format: string
  readonly mipLevels: number
  /**
   * The estimated size in MB, two decimals
   */
  readonly megabytes: string
}
