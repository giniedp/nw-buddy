const GLB_MAGIC = 0x46546c67
const CHUNK_JSON = 0x4e4f534a
const CHUNK_BIN = 0x004e4942

interface GltfTextureInfo {
  index: number
}

interface GltfNode {
  name?: string
  children?: number[]
  mesh?: number
  skin?: number
  matrix?: number[]
  [key: string]: unknown
}

interface GltfSkin {
  joints: number[]
  skeleton?: number
  inverseBindMatrices?: number
}

interface GltfPrimitive {
  attributes: Record<string, number>
  indices?: number
  material?: number
  targets?: Array<Record<string, number>>
}

interface GltfAnimation {
  samplers: Array<{ input: number; output: number }>
  channels: Array<{ sampler: number; target: { node?: number; path: string } }>
}

/**
 * The parts of a glTF document the merge handles
 */
export interface GltfJson {
  asset: object
  scene?: number
  scenes?: Array<{ nodes?: number[]; extras?: Record<string, unknown> }>
  nodes?: GltfNode[]
  meshes?: Array<{ primitives: GltfPrimitive[] }>
  skins?: GltfSkin[]
  animations?: GltfAnimation[]
  materials?: object[]
  textures?: Array<{ source?: number; sampler?: number; extensions?: Record<string, { source?: number }> }>
  samplers?: object[]
  images?: Array<{ uri?: string; bufferView?: number }>
  accessors?: Array<{ bufferView?: number; [key: string]: unknown }>
  bufferViews?: Array<{ buffer: number; byteOffset?: number; byteLength: number }>
  buffers?: Array<{ byteLength: number }>
  extensionsUsed?: string[]
  extensionsRequired?: string[]
  extras?: unknown
}

export interface GlbDocument {
  json: GltfJson
  bin: Uint8Array
}

/**
 * A model below a joint of the main model
 */
export interface GlbAttachment {
  glb: GlbDocument
  /**
   * The name of the joint
   */
  joint: string
  /**
   * The transform relative to the joint, column major
   */
  matrix: number[]
}

export interface GlbMergeOptions {
  /**
   * Models drawn along with the main model, each with its own skeleton (the worn skins of a character)
   */
  parts?: GlbDocument[]
  /**
   * Names of the mesh nodes to leave out, of the model and the parts
   */
  hidden?: string[]
  /**
   * Static in their bind pose. Left out when the model has no such joint
   */
  attachments?: GlbAttachment[]
}

export function parseGlb(data: ArrayBuffer): GlbDocument {
  const view = new DataView(data)
  // header (magic, version, length), then the json chunk (length, type, data) and the binary one
  if (data.byteLength < 20 || view.getUint32(0, true) !== GLB_MAGIC) {
    throw new Error('not a GLB')
  }
  const jsonLength = view.getUint32(12, true)
  const json = JSON.parse(new TextDecoder().decode(new Uint8Array(data, 20, jsonLength)))
  const binStart = 20 + jsonLength
  if (binStart + 8 > data.byteLength) {
    return { json, bin: new Uint8Array(0) }
  }
  return { json, bin: new Uint8Array(data, binStart + 8, view.getUint32(binStart, true)) }
}

export function writeGlb({ json, bin }: GlbDocument): ArrayBuffer {
  const text = new TextEncoder().encode(JSON.stringify(json))
  const jsonLength = align4(text.length)
  const binLength = align4(bin.length)
  const result = new ArrayBuffer(12 + 8 + jsonLength + (binLength ? 8 + binLength : 0))
  const view = new DataView(result)
  view.setUint32(0, GLB_MAGIC, true)
  view.setUint32(4, 2, true)
  view.setUint32(8, result.byteLength, true)
  view.setUint32(12, jsonLength, true)
  view.setUint32(16, CHUNK_JSON, true)
  // the json chunk is padded with spaces
  new Uint8Array(result, 20, jsonLength).fill(0x20).set(text)
  if (binLength) {
    view.setUint32(20 + jsonLength, binLength, true)
    view.setUint32(24 + jsonLength, CHUNK_BIN, true)
    new Uint8Array(result, 28 + jsonLength).set(bin)
  }
  return result
}

/**
 * One document of a model, its parts and the models attached to its joints. Only what is drawn is copied: hidden meshes
 * take their materials and textures with them.
 */
export function mergeGlbs(model: GlbDocument, { parts, hidden, attachments }: GlbMergeOptions): GlbDocument {
  const writer = new GlbWriter()
  const hiddenNames = new Set(hidden ?? [])
  const main = new GlbCopy(writer, model, hiddenNames)
  main.copyScene()
  main.copyAnimations()
  for (const part of parts ?? []) {
    new GlbCopy(writer, part, hiddenNames).copyScene()
  }
  for (const { glb, joint, matrix } of attachments ?? []) {
    const node = main.joint(joint)
    if (node) {
      writer.attach(node, matrix, new GlbCopy(writer, glb, new Set()).copyStatic())
    }
  }
  writer.json.extras = model.json.extras
  writer.json.scenes[0].extras = sceneOf(model.json)?.extras
  return writer.finish()
}

class GlbWriter {
  public readonly json: GltfJson & Required<Pick<GltfJson, 'scenes' | 'nodes'>> = {
    asset: { version: '2.0', generator: 'New World Buddy' },
    scene: 0,
    scenes: [{ nodes: [] }],
    nodes: [],
  }
  private chunks: Uint8Array[] = []
  private length = 0

  /**
   * Adds an item to a list of the document, returns its index
   */
  public add<
    K extends 'meshes' | 'skins' | 'animations' | 'materials' | 'textures' | 'samplers' | 'images' | 'accessors',
  >(key: K, item: NonNullable<GltfJson[K]>[number]): number {
    const list = (this.json[key] ??= []) as object[]
    return list.push(item) - 1
  }

  public addBufferView(item: NonNullable<GltfJson['bufferViews']>[number], data: Uint8Array): number {
    this.json.bufferViews ??= []
    const index = this.json.bufferViews.push({ ...item, buffer: 0, byteOffset: this.length }) - 1
    this.chunks.push(data)
    this.length += align4(data.length)
    return index
  }

  /**
   * Places root nodes below a node
   */
  public attach(parent: GltfNode, matrix: number[], roots: number[]) {
    const holder = this.json.nodes.push({ matrix, children: roots }) - 1
    parent.children = [...(parent.children ?? []), holder]
  }

  public useExtensions({ extensionsUsed, extensionsRequired }: GltfJson) {
    this.json.extensionsUsed = union(this.json.extensionsUsed, extensionsUsed)
    this.json.extensionsRequired = union(this.json.extensionsRequired, extensionsRequired)
  }

  public finish(): GlbDocument {
    const bin = new Uint8Array(this.length)
    let offset = 0
    for (const chunk of this.chunks) {
      bin.set(chunk, offset)
      offset += align4(chunk.length)
    }
    if (bin.length) {
      this.json.buffers = [{ byteLength: bin.length }]
    }
    return { json: this.json, bin }
  }
}

/**
 * Copies what is reachable from the scene of a document, each item once
 */
class GlbCopy {
  private nodes = new Map<number, number>()
  private copies = new Map<string, number>()

  public constructor(
    private writer: GlbWriter,
    private source: GlbDocument,
    private hidden: ReadonlySet<string>,
  ) {
    writer.useExtensions(source.json)
  }

  public copyScene() {
    const roots = this.roots.map((it) => this.copyNode(it))
    this.writer.json.scenes[0].nodes.push(...roots)
    // the skins refer to nodes anywhere, all nodes are copied before
    for (const [from, to] of this.nodes) {
      const node = this.source.json.nodes[from]
      if (node.mesh == null || this.hidden.has(node.name)) {
        continue
      }
      this.writer.json.nodes[to].mesh = this.copyMesh(node.mesh)
      if (node.skin != null) {
        this.writer.json.nodes[to].skin = this.copySkin(node.skin)
      }
    }
  }

  /**
   * Copies the meshes in their bind pose without the skeletons, returns the root nodes
   */
  public copyStatic(): number[] {
    const { nodes } = this.source.json
    const meshNodes = this.reachable(this.roots).filter((it) => nodes[it].mesh != null)
    const result: number[] = []
    if (meshNodes.some((it) => nodes[it].skin == null)) {
      result.push(...this.roots.map((it) => this.copyNode(it)))
    }
    for (const index of meshNodes) {
      const { name, mesh, skin } = nodes[index]
      if (skin == null) {
        this.writer.json.nodes[this.nodes.get(index)].mesh = this.copyMesh(mesh)
      } else {
        // a skinned mesh ignores its node transform, the vertices are in model space
        result.push(this.writer.json.nodes.push({ name, mesh: this.copyMesh(mesh, true) }) - 1)
      }
    }
    return result
  }

  private get roots(): number[] {
    return sceneOf(this.source.json)?.nodes ?? []
  }

  private reachable(indices: number[]): number[] {
    return indices.flatMap((it) => [it, ...this.reachable(this.source.json.nodes[it].children ?? [])])
  }

  public copyAnimations() {
    for (const animation of this.source.json.animations ?? []) {
      const copy = structuredClone(animation)
      for (const sampler of copy.samplers) {
        sampler.input = this.copyAccessor(sampler.input)
        sampler.output = this.copyAccessor(sampler.output)
      }
      for (const { target } of copy.channels) {
        if (target.node != null) {
          target.node = this.nodes.get(target.node)
        }
      }
      this.writer.add('animations', copy)
    }
  }

  /**
   * The copy of the joint of a name, the first one of the model's skins
   */
  public joint(name: string): GltfNode | null {
    const { nodes, skins } = this.source.json
    for (const skin of skins ?? []) {
      const index = skin.joints.find((it) => nodes[it].name === name)
      if (index != null && this.nodes.has(index)) {
        return this.writer.json.nodes[this.nodes.get(index)]
      }
    }
    return null
  }

  private copyNode(index: number): number {
    const { mesh, skin, children, ...rest } = this.source.json.nodes[index]
    const copy: GltfNode = structuredClone(rest)
    const result = this.writer.json.nodes.push(copy) - 1
    this.nodes.set(index, result)
    if (children?.length) {
      copy.children = children.map((it) => this.copyNode(it))
    }
    return result
  }

  private copyMesh(index: number, unskinned = false): number {
    return this.once('mesh', index, () => {
      const copy = structuredClone(this.source.json.meshes[index])
      for (const primitive of copy.primitives) {
        if (unskinned) {
          delete primitive.attributes['JOINTS_0']
          delete primitive.attributes['WEIGHTS_0']
        }
        this.copyAttributes(primitive.attributes)
        primitive.targets?.forEach((it) => this.copyAttributes(it))
        if (primitive.indices != null) {
          primitive.indices = this.copyAccessor(primitive.indices)
        }
        if (primitive.material != null) {
          primitive.material = this.copyMaterial(primitive.material)
        }
      }
      return this.writer.add('meshes', copy)
    })
  }

  private copyAttributes(attributes: Record<string, number>) {
    for (const name in attributes) {
      attributes[name] = this.copyAccessor(attributes[name])
    }
  }

  private copySkin(index: number): number {
    return this.once('skin', index, () => {
      const copy = structuredClone(this.source.json.skins[index])
      copy.joints = copy.joints.map((it) => this.nodes.get(it))
      if (copy.skeleton != null) {
        copy.skeleton = this.nodes.get(copy.skeleton)
      }
      if (copy.inverseBindMatrices != null) {
        copy.inverseBindMatrices = this.copyAccessor(copy.inverseBindMatrices)
      }
      return this.writer.add('skins', copy)
    })
  }

  private copyMaterial(index: number): number {
    return this.once('material', index, () => {
      const copy = structuredClone(this.source.json.materials[index])
      this.copyTextureInfos(copy)
      return this.writer.add('materials', copy)
    })
  }

  /**
   * The texture references of a material and its extensions: the properties named `…Texture`, and `textures` lists
   * (`EXT_nw_material`)
   */
  private copyTextureInfos(value: object) {
    for (const [key, item] of Object.entries(value)) {
      if (!item || typeof item !== 'object') {
        continue
      }
      if (/texture$/i.test(key)) {
        this.copyTextureInfo(item)
      }
      if (key === 'textures' && Array.isArray(item)) {
        item.forEach((it) => this.copyTextureInfo(it))
      }
      this.copyTextureInfos(item)
    }
  }

  private copyTextureInfo(info: GltfTextureInfo) {
    // -1: a texture that did not resolve
    if (typeof info.index === 'number' && info.index >= 0) {
      info.index = this.copyTexture(info.index)
    }
  }

  private copyTexture(index: number): number {
    return this.once('texture', index, () => {
      const copy = structuredClone(this.source.json.textures[index])
      if (copy.source != null) {
        copy.source = this.copyImage(copy.source)
      }
      // KHR_texture_basisu, EXT_texture_webp
      for (const extension of Object.values(copy.extensions ?? {})) {
        if (extension.source != null) {
          extension.source = this.copyImage(extension.source)
        }
      }
      if (copy.sampler != null) {
        copy.sampler = this.once('sampler', copy.sampler, () => {
          return this.writer.add('samplers', structuredClone(this.source.json.samplers[copy.sampler]))
        })
      }
      return this.writer.add('textures', copy)
    })
  }

  private copyImage(index: number): number {
    return this.once('image', index, () => {
      const copy = structuredClone(this.source.json.images[index])
      if (copy.bufferView != null) {
        copy.bufferView = this.copyBufferView(copy.bufferView)
      }
      return this.writer.add('images', copy)
    })
  }

  private copyAccessor(index: number): number {
    return this.once('accessor', index, () => {
      const copy = structuredClone(this.source.json.accessors[index])
      if (copy.bufferView != null) {
        copy.bufferView = this.copyBufferView(copy.bufferView)
      }
      return this.writer.add('accessors', copy)
    })
  }

  private copyBufferView(index: number): number {
    return this.once('bufferView', index, () => {
      const item = this.source.json.bufferViews[index]
      const start = item.byteOffset ?? 0
      return this.writer.addBufferView(item, this.source.bin.subarray(start, start + item.byteLength))
    })
  }

  private once(kind: string, index: number, copy: () => number): number {
    const key = `${kind}:${index}`
    let result = this.copies.get(key)
    if (result == null) {
      result = copy()
      this.copies.set(key, result)
    }
    return result
  }
}

function sceneOf(json: GltfJson) {
  return json.scenes?.[json.scene ?? 0]
}

function union(a: string[] | undefined, b: string[] | undefined): string[] | undefined {
  if (!a?.length && !b?.length) {
    return undefined
  }
  return [...new Set([...(a ?? []), ...(b ?? [])])]
}

function align4(length: number): number {
  return Math.ceil(length / 4) * 4
}
