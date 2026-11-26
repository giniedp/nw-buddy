import type { GameComponent, GameEntity } from '@gglib/ecs'
import type { Material } from '@gglib/graphics'
import { mat4Identity, mat4Multiply, type Mat4, type Transform } from '@gglib/math'
import { Model, type AnimationData, type NodeData, type SkinPalette } from '@gglib/model'
import { setInstanceSkinOffset } from '../../material/common'
import { CharacterAnimationSystem } from '../character/CharacterAnimationSystem'
import { GltfClipPlayer, nodeControllerId, retargetClip } from './GltfClipPlayer'

const tmp = mat4Identity()
const IDENTITY = mat4Identity()

/**
 * A skinned mesh node (of the character or of an attachment) bound to the joints of the character by name: its draws
 * read their own palette range, written from the character's joint transforms and the node's inverse bind matrices.
 */
export class GltfSkinBinding {
  /**
   * The draws of the node, their instance data takes the palette offset
   */
  public readonly draws: Float32Array[] = []
  /**
   * Joint names the character lacks, they keep the pose of the node's own model
   */
  public readonly missing: string[] = []
  public offset = -1

  private readonly bones: Transform[] = []
  private readonly inverse: Mat4[] = []
  private readonly parents: Int32Array
  private readonly matrices: Float32Array

  public get count(): number {
    return this.bones.length
  }

  public constructor(joints: Map<string, Transform>, model: Model, skinIndex: number) {
    const skin = model.skins[skinIndex]
    for (let i = 0; i < skin.joints.length; i++) {
      const own = model.transformNodes[skin.joints[i]]
      const bone = joints.get(own.name)
      if (!bone) {
        this.missing.push(own.name)
      }
      this.bones.push(bone ?? own)
      this.inverse.push(skin.inverseBindMatrices?.[i] ?? mat4Identity())
    }
    this.parents = Int32Array.from(this.bones, (bone) => this.bones.indexOf(bone.parent))
    this.matrices = new Float32Array(this.bones.length * 16)
  }

  /**
   * Writes the joint matrices (relative to the model root) into the palette range
   */
  public write(palette: SkinPalette) {
    for (let i = 0; i < this.bones.length; i++) {
      mat4Multiply(this.bones[i].world, this.inverse[i], tmp)
      this.matrices.set(tmp, i * 16)
    }
    palette.writeMatrices(this.offset, this.matrices, this.bones.length, this.parents)
  }
}

/**
 * A glTF character: the joints of its model (the rig, by name) skin its own parts and the parts of its attachments
 * (armor models with skins on the same skeleton), each part through its own palette range of the
 * {@link CharacterAnimationSystem}.
 *
 * @remarks
 * The parts render as entities of their own (one skinned mesh node each, see {@link createGltfPartModels}): the
 * entity's instance data carries the part's palette offset. Joints are matched by name, so a model with one skeleton
 * copy per part (older exports) and a model with one merged skin bind the same way.
 */
export class GltfCharacterComponent implements GameComponent {
  public entity: GameEntity
  /**
   * The model of the character, its node transforms are the pose
   */
  public readonly rig: Model

  /**
   * Plays clips on the rig's joints, see {@link setClips}
   */
  public readonly clips: GltfClipPlayer

  private readonly joints = new Map<string, Transform>()
  /**
   * The joints' index in the clip player's joints by controller id, see {@link retargetClip}
   */
  private readonly jointIndex = new Map<number, number>()
  private readonly bindings = new Set<GltfSkinBinding>()
  private palette: SkinPalette | null = null
  private changed = true

  public constructor(rig: Model) {
    this.rig = rig
    // the joint transforms relative to the model root
    rig.update(IDENTITY)
    for (const skin of rig.skins) {
      for (const index of skin.joints) {
        const node = rig.transformNodes[index]
        // the first copy of a joint wins, older exports repeat the skeleton per part
        if (node.name && !this.joints.has(node.name)) {
          this.joints.set(node.name, node)
        }
      }
    }
    const list = [...this.joints.values()]
    list.forEach((joint, index) => {
      const id = nodeControllerId(joint as Transform<NodeData>)
      if (id != null && !this.jointIndex.has(id)) {
        this.jointIndex.set(id, index)
      }
    })
    this.clips = new GltfClipPlayer(list)
  }

  /**
   * The current local transforms of the joints by controller id: translation xyz and rotation xyzw, in the axes of the
   * model file (e.g. for a posed export of the same skeleton)
   */
  public pose(): Record<string, number[]> {
    const list = [...this.joints.values()]
    const result: Record<string, number[]> = {}
    for (const [id, index] of this.jointIndex) {
      const { translation: t, rotation: r } = list[index]
      result[id] = [t.x, t.y, t.z, r.x, r.y, r.z, r.w]
    }
    return result
  }

  /**
   * Plays a sequence of clips of clip files (nodes by controller id) on the rig, an empty one restores the rest pose
   *
   * @param clips - per clip its data and the nodes of its file, the last one may loop
   */
  public setClips(
    clips: ReadonlyArray<{ data: AnimationData; nodes: ReadonlyArray<Transform<NodeData>>; loop: boolean }>,
  ) {
    this.clips.setSequence(
      clips.map((it) => ({ data: retargetClip(it.data, it.nodes, this.jointIndex), loop: it.loop })),
    )
  }

  /**
   * Binds a skinned mesh node of a model (the character's own or an attachment's) to the character's joints
   *
   * @returns null if the node has no skin
   */
  public bind(model: Model, node: Transform<NodeData>, draw: Float32Array): GltfSkinBinding | null {
    const skin = node.data?.skin
    if (skin == null || !model.skins[skin]) {
      return null
    }
    const binding = new GltfSkinBinding(this.joints, model, skin)
    binding.draws.push(draw)
    this.bindings.add(binding)
    if (this.palette) {
      this.allocate(binding)
    }
    this.changed = true
    return binding
  }

  /**
   * Releases the palette range of a binding, its draws lose the offset
   */
  public unbind(binding: GltfSkinBinding) {
    if (!this.bindings.delete(binding)) {
      return
    }
    this.release(binding)
  }

  public initialize(): void {
    this.palette = this.entity.world.getSystem(CharacterAnimationSystem).palette
    for (const binding of this.bindings) {
      this.allocate(binding)
    }
    this.changed = true
  }

  /**
   * Writes the palette ranges when the pose or the bindings changed
   */
  public animate(dt: number) {
    if (this.clips.update(dt)) {
      this.rig.update(IDENTITY)
      this.changed = true
    }
    if (!this.changed || !this.palette) {
      return
    }
    this.changed = false
    for (const binding of this.bindings) {
      binding.write(this.palette)
    }
  }

  public destroy(): void {
    for (const binding of this.bindings) {
      this.release(binding)
    }
    this.bindings.clear()
    this.palette = null
  }

  private allocate(binding: GltfSkinBinding) {
    binding.offset = this.palette.allocate(binding.count)
    for (const data of binding.draws) {
      setInstanceSkinOffset(data, binding.offset)
    }
  }

  private release(binding: GltfSkinBinding) {
    if (this.palette && binding.offset >= 0) {
      this.palette.release(binding.offset, binding.count)
    }
    for (const data of binding.draws) {
      setInstanceSkinOffset(data, null)
    }
    binding.offset = -1
  }
}

/**
 * The parts of a model: one model per mesh node, sharing the source's mesh. Skinned nodes ignore their transform (glTF),
 * the others keep their world transform relative to the model root.
 *
 * @param materials - own material instances for the parts (e.g. material params), null shares the materials
 */
export function createGltfPartModels(
  source: Model,
  materials: ((material: Material) => Material) | null,
): Array<{ node: Transform<NodeData>; model: Model }> {
  source.update(mat4Identity())
  const result: Array<{ node: Transform<NodeData>; model: Model }> = []
  for (const node of source.sceneNodes) {
    const mesh = source.meshes[node.data?.mesh]
    if (!mesh) {
      continue
    }
    const skinned = node.data.skin != null
    const part = new Model(source.device, {
      name: node.data.name,
      meta: { ...source.meta },
      meshes: [materials ? mesh.instantiate({ materials }) : mesh],
      nodes: [{ name: node.data.name, mesh: 0, matrix: skinned ? undefined : Array.from(node.world) }],
      scenes: [{ nodes: [0] }],
      scene: 0,
    })
    result.push({ node, model: part })
  }
  return result
}
