import type { AbstractType, Type } from '@gglib/utils'
import type { Component } from 'solid-js'

/**
 * How an engine object shows in the scene tree and in the properties of the selection, see `NODE_VIEWS`
 */
export interface NodeView<T extends object = any> {
  /**
   * The class. The view applies to its subclasses too, unless they have a view of their own.
   */
  type: Type<T> | AbstractType<T>
  /**
   * The icon in the tree, an svg of `ui/icons`
   */
  icon: string
  /**
   * The name of the type in the tree. Not taken from the class: minified builds lose the class names.
   */
  label: string
  /**
   * The label of one object, e.g. the name of an entity. Empty or undefined shows {@link NodeView.label}.
   */
  name?: (node: T) => string | undefined
  /**
   * The child nodes in the tree. A node without children, or with null, is a leaf.
   */
  children?: (node: T) => Iterable<object> | null
  /**
   * The properties of the selected node. `data` is never null, see `NodeProps`.
   */
  props?: Component<{ data: T }>
}
