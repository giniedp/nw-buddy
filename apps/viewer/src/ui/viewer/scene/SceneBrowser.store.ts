import type { GameEntity } from '@gglib/ecs'
import { createEffect, createMemo, createSignal, on, onCleanup } from 'solid-js'
import { createStore } from 'solid-js/store'
import { createInterval, track, type TreeController, type TreeProps } from 'tweak-ui'
import type { NwViewer } from '../../../viewer'
import svgBlockQuestion from '../../icons/block-question.svg?raw'
import { nodeLabel, nodeViewOf } from '../nodes/registry'
import type { SceneBrowserState } from './types'

/**
 * Ids of the tree nodes, shared by all trees: an object keeps its id
 */
let nodeId = 0

export type SceneBrowserStore = ReturnType<typeof createSceneBrowserStore>

/**
 * The scene tree and its selection: the game world and the scene entity as roots, the labels, icons and children
 * from the node views (`NODE_VIEWS`). A ray selection in the viewport selects the entity and scrolls it into view.
 */
export function createSceneBrowserStore(props: { viewer: NwViewer }) {
  const ids = new WeakMap<object, string>()
  let controller: TreeController | null = null
  const [selection, setSelection] = createSignal<object | null>(null)
  // the scene is created when the engine initializes
  const scene = track(() => props.viewer.scene, { interval: 500, equals: (a, b) => a === b })
  const version = createInterval(1000)
  const roots = createMemo(() => {
    const it = scene()
    return it ? [props.viewer.world, it.entity] : []
  })

  const [state, setState] = createStore<SceneBrowserState>({
    expanded: new Set<string>(),
    get hasScene() {
      return !!scene()
    },
    get selectedId() {
      const it = selection()
      return it ? idOf(it) : null
    },
    get version() {
      return version()
    },
  })

  function idOf(node: object): string {
    let id = ids.get(node)
    if (!id) {
      id = String(++nodeId)
      ids.set(node, id)
    }
    return id
  }

  /**
   * Expands the given nodes, keeps the other expanded nodes
   */
  function expand(...nodes: object[]) {
    setState('expanded', new Set([...state.expanded, ...nodes.map(idOf)]))
  }

  /**
   * Expands the parents of the entity and scrolls it into view
   */
  function scrollToEntity(entity: GameEntity) {
    const next = new Set(state.expanded)
    for (let it = entity.parent; it; it = it.parent) {
      next.add(idOf(it))
    }
    setState('expanded', next)
    // after the tree has rendered the expanded rows
    setTimeout(() => controller?.scrollTo(idOf(entity)), 50)
  }

  // the top level nodes start expanded
  createEffect(
    on(scene, (it) => {
      if (it) {
        expand(props.viewer.world, it.entity)
      }
    }),
  )

  const onRaySelection = (entity: GameEntity) => {
    setSelection(entity)
    scrollToEntity(entity)
  }
  props.viewer.onRaySelection.add(onRaySelection)
  onCleanup(() => props.viewer.onRaySelection.remove(onRaySelection))

  return {
    state,
    /**
     * The props of the `Tree` that do not change, spread them into it
     */
    tree: {
      getId: idOf,
      getLabel: nodeLabel,
      getChildren: (node: object) => nodeViewOf(node)?.children?.(node) ?? null,
      controller: (it: TreeController) => {
        controller = it
      },
    } satisfies Partial<TreeProps<object>>,
    /**
     * The svg of the node's icon, a question mark for nodes without a view
     */
    iconOf: (node: object) => nodeViewOf(node)?.icon ?? svgBlockQuestion,
    /**
     * The root nodes, empty without a scene
     */
    roots,
    /**
     * The selected engine object
     */
    selection,
    select(node: object) {
      setSelection(node)
    },
    setExpanded(ids: ReadonlySet<string>) {
      setState('expanded', ids)
    },
  }
}
