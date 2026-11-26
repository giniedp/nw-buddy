import { GlbDocument, GltfJson, mergeGlbs, parseGlb, writeGlb } from './glb-merge'

/**
 * A model of one joint `root` and a skinned mesh node, its accessor holds one float
 */
function document(name: string, value: number, values: Partial<GltfJson> = {}): GlbDocument {
  return {
    bin: new Uint8Array(new Float32Array([value]).buffer),
    json: {
      asset: { version: '2.0' },
      scene: 0,
      scenes: [{ nodes: [0, 1] }],
      nodes: [{ name: 'root' }, { name, mesh: 0, skin: 0 }],
      meshes: [{ primitives: [{ attributes: { POSITION: 0 }, material: 0 }] }],
      skins: [{ joints: [0] }],
      materials: [
        {
          pbrMetallicRoughness: { baseColorTexture: { index: 0 } },
          extensions: {
            EXT_nw_material: { textures: [{ index: 0 }, { index: -1 }], smoothTexture: { index: 0 } },
            EXT_nw_mtl_ref: { file: 'a.mtl', index: 0 },
          },
        },
      ],
      textures: [{ extensions: { KHR_texture_basisu: { source: 0 } } }],
      images: [{ uri: `${name}.ktx2` }],
      accessors: [{ bufferView: 0, componentType: 5126, count: 1, type: 'SCALAR' }],
      bufferViews: [{ buffer: 0, byteLength: 4 }],
      buffers: [{ byteLength: 4 }],
      extensionsUsed: ['EXT_nw_material'],
      ...values,
    },
  }
}

/**
 * The float of a mesh node's accessor
 */
function valueOf({ json, bin }: GlbDocument, nodeName: string): number {
  const node = json.nodes.find((it) => it.name === nodeName)
  const accessor = json.accessors[json.meshes[node.mesh].primitives[0].attributes['POSITION']]
  const view = json.bufferViews[accessor.bufferView]
  return new DataView(bin.buffer, bin.byteOffset + view.byteOffset).getFloat32(0, true)
}

describe('glb', () => {
  it('reads what it writes', () => {
    const { json, bin } = parseGlb(writeGlb(document('body', 2)))
    expect(json).toEqual(document('body', 2).json)
    expect([...bin]).toEqual([...document('body', 2).bin])
  })

  it('refuses other files', () => {
    expect(() => parseGlb(new ArrayBuffer(40))).toThrow()
  })
})

describe('mergeGlbs', () => {
  it('draws the parts along with the model', () => {
    const merged = mergeGlbs(document('body', 2), { parts: [document('helmet', 3)] })
    expect(valueOf(merged, 'body')).toBe(2)
    expect(valueOf(merged, 'helmet')).toBe(3)
    expect(merged.json.scenes[0].nodes.map((it) => merged.json.nodes[it].name)).toEqual([
      'root',
      'body',
      'root',
      'helmet',
    ])
    expect(merged.json.skins).toEqual([{ joints: [0] }, { joints: [2] }])
    expect(merged.json.buffers).toEqual([{ byteLength: 8 }])
  })

  it('moves the texture references, not the material ones', () => {
    const merged = mergeGlbs(document('body', 2), { parts: [document('helmet', 3)] })
    const material = merged.json.materials[1] as any
    expect(material.pbrMetallicRoughness.baseColorTexture.index).toBe(1)
    expect(material.extensions.EXT_nw_material.textures).toEqual([{ index: 1 }, { index: -1 }])
    expect(material.extensions.EXT_nw_material.smoothTexture.index).toBe(1)
    expect(material.extensions.EXT_nw_mtl_ref.index).toBe(0)
    expect(merged.json.images[merged.json.textures[1].extensions['KHR_texture_basisu'].source].uri).toBe('helmet.ktx2')
  })

  it('leaves out the hidden meshes with their textures', () => {
    const merged = mergeGlbs(document('body', 2), { parts: [document('helmet', 3)], hidden: ['body'] })
    expect(merged.json.images).toEqual([{ uri: 'helmet.ktx2' }])
    expect(merged.json.meshes.length).toBe(1)
    expect(merged.json.nodes.find((it) => it.name === 'body').mesh).toBeUndefined()
  })

  it('attaches models below a joint', () => {
    const matrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 2, 3, 1]
    const merged = mergeGlbs(document('body', 2), {
      attachments: [
        { glb: document('sword', 4), joint: 'root', matrix },
        { glb: document('bow', 5), joint: 'missing', matrix },
      ],
    })
    expect(merged.json.scenes[0].nodes).toEqual([0, 1])
    const holder = merged.json.nodes[merged.json.nodes[0].children[0]]
    expect(holder.matrix).toEqual(matrix)
    // without its skeleton
    expect(holder.children.map((it) => merged.json.nodes[it])).toEqual([{ name: 'sword', mesh: 1 }])
    expect(merged.json.skins.length).toBe(1)
    expect(valueOf(merged, 'sword')).toBe(4)
    expect(merged.json.nodes.some((it) => it.name === 'bow')).toBe(false)
  })

  it('keeps the transforms of attached models without a skin', () => {
    const nodes = [
      { name: 'base', translation: [0, 1, 0], children: [1] },
      { name: 'sword', mesh: 0 },
    ]
    const merged = mergeGlbs(document('body', 2), {
      attachments: [
        { glb: document('sword', 4, { nodes, scenes: [{ nodes: [0] }], skins: [] }), joint: 'root', matrix: [] },
      ],
    })
    const holder = merged.json.nodes[merged.json.nodes[0].children[0]]
    const base = merged.json.nodes[holder.children[0]]
    expect(base['translation']).toEqual([0, 1, 0])
    expect(base.children.map((it) => merged.json.nodes[it].name)).toEqual(['sword'])
    expect(valueOf(merged, 'sword')).toBe(4)
  })

  it('keeps the animations and the extras of the model', () => {
    const model = document('body', 2, {
      animations: [
        { samplers: [{ input: 0, output: 0 }], channels: [{ sampler: 0, target: { node: 0, path: 'rotation' } }] },
      ],
      scenes: [{ nodes: [1, 0], extras: { sockets: [] } }],
    })
    const merged = mergeGlbs(model, {})
    expect(merged.json.scenes[0].extras).toEqual({ sockets: [] })
    expect(merged.json.nodes[merged.json.animations[0].channels[0].target.node].name).toBe('root')
  })
})
