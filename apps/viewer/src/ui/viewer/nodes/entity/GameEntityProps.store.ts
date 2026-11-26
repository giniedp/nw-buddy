import type { TransformComponent } from '@gglib/components'
import { GetComponent, type GameEntity } from '@gglib/ecs'
import { createMemo } from 'solid-js'
import { createStore } from 'solid-js/store'
import { track } from 'tweak-ui'
import { materialAssetPath, normalizeAssetPath } from '../../../../content/assetIds'
import { DebugShapeComponent } from '../../../../game/debug/DebugShapeComponent'
import { MeshLoaderComponent } from '../../../../game/slice/MeshLoaderComponent'
import { usePanel } from '../../PanelScope'
import type { GameEntityPropsState, SourceFile } from './types'

export type GameEntityPropsStore = ReturnType<typeof createGameEntityPropsStore>

/**
 * The state of an entity and its activation. The transform and the debug shapes are shown on the entity: the
 * components of an inactive entity are not listed in the tree.
 */
export function createGameEntityPropsStore(props: { data: GameEntity }) {
  const panel = usePanel()
  const entity = () => props.data
  // activation runs in the engine, it may complete later
  const active = track(() => panel.pull(() => entity().isActive), { interval: 500 })
  const stateName = track(() => panel.pull(() => entity().stateName), { interval: 500 })
  const componentCount = track(() => panel.pull(() => entity().activeComponents.length), { interval: 500 })
  const name = createMemo(() => panel.pull(() => entity().name))
  const files = createMemo(() => sourceFiles(meshLoaderOf(entity())))

  const [state] = createStore<GameEntityPropsState>({
    get name() {
      return name()
    },
    get stateName() {
      return stateName()
    },
    get active() {
      return active()
    },
    get componentCount() {
      return componentCount()
    },
  })

  return {
    state,
    /**
     * The game files of the entity's model, see {@link sourceFiles}
     */
    files,
    transform: () => panel.pull(() => entity().getTransform<TransformComponent>()),
    debugShapes: () => panel.pull(() => entity().component(DebugShapeComponent, GetComponent.Optional)),
    setActive(value: boolean) {
      const it = entity()
      if (value && it.canActivate) {
        it.activate()
      }
      if (!value && it.canDeactivate) {
        it.deactivate()
      }
      panel.redraw()
    },
  }
}

/**
 * The game files of a model: the mesh and the material of its {@link MeshLoaderComponent}. The model is exported
 * with its material.
 */
export function sourceFiles(loader: Pick<MeshLoaderComponent, 'data'> | null): SourceFile[] {
  if (!loader) {
    return []
  }
  const material = loader.data.material ? materialAssetPath(loader.data.material) : undefined
  const result: SourceFile[] = [{ label: 'Model', path: normalizeAssetPath(loader.data.mesh), material }]
  if (material) {
    result.push({ label: 'Material', path: material })
  }
  return result
}

/**
 * The loader of the entity's model. It is on the entity, or on its parent: the model entities are children of the
 * loader's entity.
 */
function meshLoaderOf(entity: GameEntity): MeshLoaderComponent | null {
  return (
    entity.component(MeshLoaderComponent, GetComponent.Optional) ??
    entity.getTransform()?.parent?.entity?.component(MeshLoaderComponent, GetComponent.Optional) ??
    null
  )
}
