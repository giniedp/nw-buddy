import { CameraComponent, MeshComponent, ModelComponent, TransformComponent } from '@gglib/components'
import { GameEntity, GameSystem, GameWorld } from '@gglib/ecs'
import { GameLoop } from '@gglib/game'
import { Device, Geometry, Material, Mesh } from '@gglib/graphics'
import { BoundingBox, BoundingSphere } from '@gglib/math'
import { Model } from '@gglib/model'
import type { AbstractType, Type } from '@gglib/utils'
import { AudioSystem } from '../../../audio/AudioSystem'
import { DebugShapeComponent } from '../../../game/debug/DebugShapeComponent'
import { DebugShapeSystem } from '../../../game/debug/DebugShapeSystem'
import { LevelSystem } from '../../../game/level/LevelSystem'
import { TimeOfDay } from '../../../game/level/TimeOfDay'
import { LightSystem } from '../../../game/light/LightSystem'
import { PlayerMovementComponent } from '../../../game/player/PlayerMovementComponent'
import svgBrush from '../../icons/brush.svg?raw'
import svgCamera from '../../icons/camera.svg?raw'
import svgCircle from '../../icons/circle.svg?raw'
import svgCube from '../../icons/cube.svg?raw'
import svgCubesStacked from '../../icons/cubes-stacked.svg?raw'
import svgGamepad from '../../icons/gamepad.svg?raw'
import svgGlobe from '../../icons/globe.svg?raw'
import svgGpu from '../../icons/gpu.svg?raw'
import svgHexagonNodes from '../../icons/hexagon-nodes.svg?raw'
import svgNetworkWired from '../../icons/network-wired.svg?raw'
import svgSunCloud from '../../icons/sun-cloud.svg?raw'
import svgTimer from '../../icons/timer.svg?raw'
import svgTriangle from '../../icons/triangle.svg?raw'
import { AudioSystemProps } from './AudioSystemProps'
import { BoundingBoxProps } from './BoundingBoxProps'
import { BoundingSphereProps } from './BoundingSphereProps'
import { CameraComponentProps } from './CameraComponentProps'
import { DebugShapeComponentProps } from './DebugShapeComponentProps'
import { DebugShapeSystemProps } from './DebugShapeSystemProps'
import { DeviceProps } from './DeviceProps'
import { GameEntityProps } from './entity/GameEntityProps'
import { GameLoopProps } from './GameLoopProps'
import { GameSystemProps } from './GameSystemProps'
import { GeometryProps } from './GeometryProps'
import { LightSystemProps } from './LightSystemProps'
import { MaterialProps } from './material/MaterialProps'
import { MeshComponentProps } from './MeshComponentProps'
import { MeshProps } from './MeshProps'
import { ModelComponentProps } from './ModelComponentProps'
import { ModelProps } from './ModelProps'
import { PlayerMovementComponentProps } from './PlayerMovementComponentProps'
import { TimeOfDayProps } from './TimeOfDayProps'
import { TransformComponentProps } from './TransformComponentProps'
import type { NodeView } from './types'

/**
 * A view of the class: infers the type of the node from the class
 */
function nodeView<T extends object>(type: Type<T> | AbstractType<T>, view: Omit<NodeView<T>, 'type'>): NodeView<T> {
  return { type, ...view }
}

/**
 * The views of the scene tree nodes. A node takes the view of its class, or of its closest base class with a view.
 */
export const NODE_VIEWS: NodeView[] = [
  // the collection iterates its systems untyped
  nodeView(GameWorld, { icon: svgGlobe, label: 'GameWorld', children: (it) => it.systems as Iterable<GameSystem> }),
  // the systems without a view of their own: the class name, which a minified build shortens
  nodeView(GameSystem, {
    icon: svgNetworkWired,
    label: 'GameSystem',
    name: (it) => it.constructor.name,
    props: GameSystemProps,
  }),
  nodeView(LevelSystem, { icon: svgNetworkWired, label: 'LevelSystem', props: GameSystemProps }),
  nodeView(LightSystem, { icon: svgTimer, label: 'Light System', props: LightSystemProps }),
  nodeView(DebugShapeSystem, { icon: svgNetworkWired, label: 'DebugShapeSystem', props: DebugShapeSystemProps }),
  nodeView(AudioSystem, { icon: svgTimer, label: 'Audio', props: AudioSystemProps }),
  nodeView(TimeOfDay, { icon: svgSunCloud, label: 'TimeOfDay', props: TimeOfDayProps }),
  nodeView(GameLoop, { icon: svgTimer, label: 'GameLoop', props: GameLoopProps }),
  nodeView(Device, { icon: svgGpu, label: 'Device', props: DeviceProps }),
  nodeView(GameEntity, {
    icon: svgCube,
    label: 'GameEntity',
    name: (it) => it.name,
    children: entityChildren,
    props: GameEntityProps,
  }),
  nodeView(TransformComponent, { icon: svgCube, label: 'TransformComponent', props: TransformComponentProps }),
  nodeView(CameraComponent, { icon: svgCamera, label: 'CameraComponent', props: CameraComponentProps }),
  nodeView(PlayerMovementComponent, {
    icon: svgGamepad,
    label: 'PlayerMovementComponent',
    props: PlayerMovementComponentProps,
  }),
  nodeView(DebugShapeComponent, {
    icon: svgNetworkWired,
    label: 'DebugShapeComponent',
    props: DebugShapeComponentProps,
  }),
  nodeView(ModelComponent, {
    icon: svgCubesStacked,
    label: 'ModelComponent',
    children: (it) => (it.model ? [it.model] : null),
    props: ModelComponentProps,
  }),
  nodeView(Model, { icon: svgCubesStacked, label: 'Model', children: modelChildren, props: ModelProps }),
  nodeView(MeshComponent, {
    icon: svgHexagonNodes,
    label: 'MeshComponent',
    children: (it) => (it.mesh ? [it.mesh] : null),
    props: MeshComponentProps,
  }),
  nodeView(Mesh, { icon: svgHexagonNodes, label: 'Mesh', children: meshChildren, props: MeshProps }),
  nodeView(Material, { icon: svgBrush, label: 'Material', props: MaterialProps }),
  nodeView(Geometry, { icon: svgTriangle, label: 'Geometry', props: GeometryProps }),
  nodeView(BoundingBox, { icon: svgCube, label: 'BoundingBox', props: BoundingBoxProps }),
  nodeView(BoundingSphere, { icon: svgCircle, label: 'BoundingSphere', props: BoundingSphereProps }),
]

const viewOfType = new Map<Function, NodeView | null>()

/**
 * The view of a node, see {@link NODE_VIEWS}. Undefined for nodes without a view.
 */
export function nodeViewOf(node: object | null | undefined): NodeView | undefined {
  if (!node) {
    return undefined
  }
  const type = node.constructor
  if (!viewOfType.has(type)) {
    viewOfType.set(type, findNodeView(NODE_VIEWS, type))
  }
  return viewOfType.get(type) ?? undefined
}

/**
 * The view of the type, or of its closest base class with a view
 */
export function findNodeView(views: readonly NodeView[], type: Function | undefined): NodeView | null {
  for (let it = type; it && it !== Function.prototype; it = Object.getPrototypeOf(it)) {
    const view = views.find((view) => view.type === it)
    if (view) {
      return view
    }
  }
  return null
}

/**
 * The label of a node in the tree: its name, the label of its view, or the class name
 */
export function nodeLabel(node: object): string {
  const view = nodeViewOf(node)
  return view?.name?.(node) || view?.label || node.constructor?.name || ''
}

function* entityChildren(entity: GameEntity): Iterable<object> {
  for (const comp of entity.activeComponents) {
    yield comp
  }
  for (const child of entity.getTransform()?.children ?? []) {
    yield child.entity
  }
}

function* modelChildren(model: Model): Iterable<object> {
  if (model.boundingBox) {
    yield model.boundingBox
  }
  if (model.boundingSphere) {
    yield model.boundingSphere
  }
  yield* model.meshes
}

function* meshChildren(mesh: Mesh): Iterable<object> {
  if (mesh.boundingBox) {
    yield mesh.boundingBox
  }
  if (mesh.boundingSphere) {
    yield mesh.boundingSphere
  }
  yield* mesh.materials
  yield* mesh.geometries
}
