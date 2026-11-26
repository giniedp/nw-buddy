import { TransformComponent } from '@gglib/components'
import type { GameComponent, GameEntity } from '@gglib/ecs'
import {
  DEGREE_TO_RAD,
  mat4CreateFromQuatValues,
  mat4CreateRotationX,
  mat4CreateRotationY,
  mat4CreateRotationZ,
  mat4CreateTranslationXYZ,
  mat4Decompose,
  mat4Identity,
  mat4Multiply,
  type Mat4,
  type Transform,
} from '@gglib/math'
import type { Model, NodeData } from '@gglib/model'
import type { MaterialParams } from '../../material/appearance'
import { GltfCharacterComponent } from './GltfCharacterComponent'
import { createGltfParts, destroyGltfParts, setGltfPartParams, type GltfPart } from './gltfParts'

/**
 * A model attached to a character (e.g. a weapon on a socket)
 */
export interface GltfAttachment {
  url: string
  /**
   * The root the file's buffer and image uris resolve against, default the folder of the file
   */
  rootUrl?: string
  /**
   * Public params of the model's materials (dye colors), see `appearanceParams` / `dyedAppearanceParams`
   */
  materialParams?: MaterialParams | null
}

/**
 * Where models sit on a socket, in the socket's space and game axes: meters, and degrees about x, y, z (x applied first,
 * as the engine's equip type offsets)
 */
export interface GltfSocketOffset {
  position?: number[]
  rotation?: number[]
}

/**
 * A bone attachment of a character file (scene extras `sockets` of an nwbt export)
 */
export interface GltfSocketDefinition {
  name: string
  joint: string
  /**
   * The transform relative to the joint
   */
  matrix: Mat4
}

/**
 * A model on a socket: its own skeleton (rest pose) skins its parts, the entity carries the socket's transform
 */
interface SocketModel {
  url: string
  model: Model
  materialParams: MaterialParams
  parts: GltfPart[]
  transform: TransformComponent | null
  entity: GameEntity | null
}

interface SocketState {
  name: string
  models: SocketModel[]
  /**
   * Increments with each {@link GltfSockets.set}, loads of an older call are dropped
   */
  generation: number
  offset: Mat4
  /**
   * The joint of the socket in the holder's model, null without a holder or when it lacks the joint
   */
  joint: Transform<NodeData> | null
  /**
   * The socket × the offset, relative to the joint
   */
  local: Mat4
}

/**
 * The models on the sockets of a glTF character (e.g. the weapons in its hands). They are kept without a holder and
 * move to the next one, see {@link attach}.
 */
export class GltfSockets {
  private readonly load: (attachment: GltfAttachment) => Promise<Model>
  private readonly states: SocketState[] = []
  private definitions: GltfSocketDefinition[] = []
  private holder: Model | null = null
  private parent: GameEntity | null = null
  private readonly world = mat4Identity()

  public constructor(load: (attachment: GltfAttachment) => Promise<Model>) {
    this.load = load
  }

  /**
   * The names of the holder's sockets (e.g. `righthandattach`, `left_sword`)
   */
  public get names(): string[] {
    return this.definitions.map((it) => it.name)
  }

  /**
   * Places models on a socket, replacing the socket's models. A model keeps its own skeleton, its root sits on the
   * socket and follows the socket's joint. An empty list empties the socket.
   *
   * @remarks
   * Idempotent: models of the same urls stay and take the new material params and offset. A later call for the same
   * socket replaces a pending one, which rejects with an `AbortError`.
   */
  public async set(name: string, attachments: GltfAttachment[], offset: GltfSocketOffset = {}): Promise<void> {
    const state = this.state(name)
    const generation = ++state.generation
    state.offset = socketOffsetMatrix(offset)
    this.resolve(state)
    if (sameUrls(state.models, attachments)) {
      state.models.forEach((it, index) => {
        it.materialParams = { ...attachments[index].materialParams }
        setGltfPartParams(it.parts, it.materialParams)
      })
      return
    }
    const models = await Promise.all(attachments.map((it) => this.load(it)))
    if (generation !== state.generation) {
      throw new DOMException(`replaced: ${name}`, 'AbortError')
    }
    state.models.forEach(destroySocketModel)
    state.models = models.map((model, index) => {
      return {
        url: attachments[index].url,
        model,
        materialParams: { ...attachments[index].materialParams },
        parts: [],
        transform: null,
        entity: null,
      }
    })
    this.createModels(state)
  }

  /**
   * Shows the models on a holder, in place of the current one. A holder without sockets (or without their joints)
   * holds nothing.
   *
   * @param model - the holder, its node transforms are the pose
   * @param parent - the entity the models are created below, the holder's node transforms are relative to it
   */
  public attach(model: Model, parent: GameEntity) {
    this.detach()
    this.holder = model
    this.parent = parent
    this.definitions = readSockets(model)
    for (const state of this.states) {
      this.resolve(state)
      this.createModels(state)
    }
  }

  /**
   * Takes the models off their holder
   */
  public detach() {
    for (const state of this.states) {
      state.models.forEach(destroySocketModel)
      state.joint = null
    }
    this.holder = null
    this.parent = null
    this.definitions = []
  }

  /**
   * Takes the models off their holder and drops them, a pending {@link set} rejects with an `AbortError`
   */
  public clear() {
    this.detach()
    for (const state of this.states) {
      state.generation++
    }
    this.states.length = 0
  }

  /**
   * Moves the models to their sockets: joint (current pose) × socket × offset
   */
  public update() {
    for (const state of this.states) {
      this.place(state)
    }
  }

  private state(name: string): SocketState {
    let state = this.states.find((it) => it.name === name)
    if (!state) {
      state = { name, models: [], generation: 0, offset: mat4Identity(), joint: null, local: mat4Identity() }
      this.states.push(state)
    }
    return state
  }

  private resolve(state: SocketState) {
    const definition = findSocket(this.definitions, state.name)
    state.joint = null
    if (!this.holder || !definition) {
      return
    }
    state.joint = findJoint(this.holder, definition.joint)
    state.local = mat4Multiply(definition.matrix, state.offset)
  }

  private createModels(state: SocketState) {
    if (!this.parent || !state.joint) {
      return
    }
    for (const it of state.models) {
      const rig = new GltfCharacterComponent(it.model)
      it.transform = new TransformComponent({ local: mat4Identity() })
      it.entity = this.parent.world.createEntity({
        name: `Socket ${it.url}`,
        parent: this.parent,
        transform: it.transform,
        components: [rig],
      })
      it.parts = createGltfParts({ model: it.model, rig, parent: it.entity, materialParams: it.materialParams })
    }
    this.place(state)
  }

  private place(state: SocketState) {
    if (!state.joint) {
      return
    }
    mat4Multiply(state.joint.world, state.local, this.world)
    for (const { transform } of state.models) {
      if (transform) {
        mat4Decompose(this.world, transform.scale, transform.rotation, transform.translation)
        transform.markAsChanged()
      }
    }
  }
}

/**
 * Moves the models of {@link GltfSockets} with their holder, updated by the `GltfAnimationSystem` after the poses
 */
export class GltfSocketsComponent implements GameComponent {
  public entity: GameEntity
  public readonly sockets: GltfSockets

  public constructor(sockets: GltfSockets) {
    this.sockets = sockets
  }
}

/**
 * The sockets of a character file (scene extras `sockets`: name, joint, position, rotation x y z w)
 */
export function readSockets(model: Pick<Model, 'scene' | 'scenes'>): GltfSocketDefinition[] {
  const sockets = model.scenes[model.scene]?.extras?.['sockets'] as
    | Array<{ name: string; joint: string; position: number[]; rotation: number[] }>
    | undefined
  return (sockets ?? []).map((it) => {
    const [x, y, z] = it.position
    const [qx, qy, qz, qw] = it.rotation
    return {
      name: it.name,
      joint: it.joint,
      matrix: mat4Multiply(mat4CreateTranslationXYZ(x, y, z), mat4CreateFromQuatValues(qx, qy, qz, qw)),
    }
  })
}

/**
 * The socket of a name. One the character lacks is replaced by its mirror (the players have `left_sword`, no
 * `right_sword`), else by the first one as the game does.
 */
export function findSocket(
  definitions: ReadonlyArray<GltfSocketDefinition>,
  name: string,
): GltfSocketDefinition | null {
  const find = (key: string) => definitions.find((it) => it.name === key)
  return find(name) ?? find(mirrorSocket(name)) ?? definitions[0] ?? null
}

/**
 * The socket of the other side: `right…` ↔ `left…`, other names stay
 */
function mirrorSocket(name: string): string {
  if (name.startsWith('right')) {
    return `left${name.slice(5)}`
  }
  if (name.startsWith('left')) {
    return `right${name.slice(4)}`
  }
  return name
}

/**
 * The offset of a socket's models in the axes of the exports (y-up): translation × Rz × Ry × Rx (degrees) in game axes,
 * the game's x, y, z are -x, z, y there
 */
export function socketOffsetMatrix(offset: GltfSocketOffset): Mat4 {
  const [x = 0, y = 0, z = 0] = offset.position ?? []
  const [rx = 0, ry = 0, rz = 0] = (offset.rotation ?? []).map((it) => it * DEGREE_TO_RAD)
  const rotation = mat4Multiply(
    mat4CreateRotationY(rz),
    mat4Multiply(mat4CreateRotationZ(ry), mat4CreateRotationX(-rx)),
  )
  return mat4Multiply(mat4CreateTranslationXYZ(-x, z, y), rotation)
}

/**
 * Where models sit that are placed on a socket: the joint's name and the socket × the offset relative to it. Null
 * without sockets.
 *
 * @param gltf - the JSON of the character's glTF
 */
export function socketPlacement(
  gltf: Pick<Model, 'scene' | 'scenes'>,
  name: string,
  offset: GltfSocketOffset = {},
): { joint: string; matrix: number[] } | null {
  const definition = findSocket(readSockets(gltf), name)
  if (!definition) {
    return null
  }
  return { joint: definition.joint, matrix: Array.from(mat4Multiply(definition.matrix, socketOffsetMatrix(offset))) }
}

/**
 * A joint of the model's skins by name. The first copy wins, older exports repeat the skeleton per part.
 */
function findJoint(model: Model, name: string): Transform<NodeData> | null {
  const nodes = model.transformNodes as ReadonlyArray<Transform<NodeData>>
  for (const skin of model.skins) {
    for (const index of skin.joints) {
      if (nodes[index].name === name) {
        return nodes[index]
      }
    }
  }
  return null
}

function destroySocketModel(socketModel: SocketModel) {
  destroyGltfParts(socketModel.parts)
  socketModel.parts = []
  if (socketModel.entity) {
    socketModel.entity.destroy()
    socketModel.entity.setParent(null)
  }
  socketModel.entity = null
  socketModel.transform = null
}

function sameUrls(models: ReadonlyArray<{ url: string }>, attachments: GltfAttachment[]): boolean {
  if (models.length !== attachments.length) {
    return false
  }
  return models.every((it, index) => it.url === attachments[index].url)
}
