import type { RenderPass } from '@gglib/render'
import type { AbstractType, Type } from '@gglib/utils'
import type { Component } from 'solid-js'

/**
 * The settings of a kind of render pass, see `PASS_FIELDS`
 */
export interface PassFieldsView<T extends RenderPass = any> {
  type: Type<T> | AbstractType<T>
  fields: Component<{ pass: T }>
}

export interface PassTimerState {
  /**
   * The pass has a GPU timer
   */
  readonly enabled: boolean
}
