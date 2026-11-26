// Trims the stage export to what the fixed camera sees, adds the light blockers and detail maps of config.json and
// instances repeated meshes (EXT_mesh_gpu_instancing). The textures stay the original PNG. See README.md.
// node tools/stage/process.mjs <png export.glb> <out.glb>
import { createRequire } from 'node:module'
import { readFileSync, writeFileSync } from 'node:fs'
import { readGlbJson, restoreLightExtras } from './glb-json.mjs'
import { EXT_NW_MATERIAL, NwMaterialExtension } from './nw-material-ext.mjs'

const require = createRequire(new URL('../../node_modules/.pnpm/node_modules/', import.meta.url))
const { NodeIO } = require('@gltf-transform/core')
const { ALL_EXTENSIONS } = require('@gltf-transform/extensions')
const { dedup, prune, instance } = require('@gltf-transform/functions')

const [input, output] = process.argv.slice(2)
const readData = (name) => JSON.parse(readFileSync(new URL(name, import.meta.url), 'utf8'))
const similar = readData('data/similar.json')
const reuse = readData('data/reuse.json')
const config = readData('config.json')

const io = new NodeIO().registerExtensions([...ALL_EXTENSIONS, NwMaterialExtension])
const doc = await io.read(input)
const root = doc.getRoot()

// 0. stable ids: the raw index of nodes and materials (png and dds exports have the same structure), Blender imports
// them as custom properties (blender_frame.py)
root.listNodes().forEach((it, index) => it.setExtras({ ...it.getExtras(), sid: index }))
root.listMaterials().forEach((it, index) => it.setExtras({ ...it.getExtras(), sid: index }))

// 1. every material keeps its game material (EXT_nw_material): the viewer renders it with the game's shaders (Illum,
// GeometryBeam, Geometryfog, ...) and prefers it over the glTF material. The volumetric materials (fog spheres, glow
// cards, light beams, fog sheets) are found by their game .mtl, read from the raw json (EXT_nw_mtl_ref is not loaded
// by gltf-transform, the material order is kept)
const json = readGlbJson(input)
const materials = root.listMaterials()
const volumetric = new Set()
json.materials.forEach((it, index) => {
  const file = it.extensions?.EXT_nw_mtl_ref?.file || ''
  if (/^objects\/volumetrics\//i.test(file)) {
    volumetric.add(materials[index])
  }
})
for (const mat of volumetric) {
  // the game shaders deform along the normals: prune drops the normals of unlit materials as unused
  mat.setExtension('KHR_materials_unlit', null)
}
console.log('volumetric materials', volumetric.size)

// keep only what the fixed camera sees (frame.json of blender_frame.py: "nodeSid:materialSid" pairs). The fog cards
// are not part of it: all of the export box stay (the scene's fog)
{
  const keep = new Set(readData('data/frame.json').keep)
  let removed = 0
  for (const node of root.listNodes()) {
    const mesh = node.getMesh()
    if (!mesh) {
      continue
    }
    const sid = node.getExtras().sid
    const prims = mesh.listPrimitives()
    const kept = prims.filter((it) => {
      return volumetric.has(it.getMaterial()) || keep.has(`${sid}:${it.getMaterial()?.getExtras().sid}`)
    })
    if (kept.length === prims.length) {
      continue
    }
    removed += prims.length - kept.length
    if (kept.length === 0) {
      node.setMesh(null)
      continue
    }
    // meshes are shared by the instances: a copy with the kept primitives
    const copy = doc.createMesh(mesh.getName())
    for (const prim of kept) {
      copy.addPrimitive(prim)
    }
    node.setMesh(copy)
  }
  console.log('frame: removed primitives', removed)
}

// helper meshes: shadow casters, the impostor box
const DROP_NODES = /^(shadow_card|sm_impostershadowbox|primitive_plane_noproxy)/i
let dropped = 0
for (const node of root.listNodes()) {
  const mesh = node.getMesh()
  if (!mesh || !DROP_NODES.test(node.getName())) {
    continue
  }
  // light shaft planes with a volumetric material stay
  if (mesh.listPrimitives().some((it) => volumetric.has(it.getMaterial()))) {
    continue
  }
  node.setMesh(null)
  dropped += 1
}
// the texture groups picked for removal (drop.json, image names from Blender, cut at 63 characters)
const dropList = readData('data/drop.json')
const dropImages = dropList.groups.flatMap((it) => it.images)
// and the materials of these diffuse textures (full names, picked from diffuse/page-*.jpg)
const dropDiffuse = new Set(dropList.diffuse || [])
function isDropped(name) {
  return dropImages.some((it) => it === name || (it.length >= 63 && name.startsWith(it)))
}
let picked = 0
for (const mesh of root.listMeshes()) {
  for (const prim of mesh.listPrimitives()) {
    const mat = prim.getMaterial()
    const diffuse = mat?.getBaseColorTexture()?.getName()
    if (materialTextures(mat).some((it) => isDropped(it.getName())) || dropDiffuse.has(diffuse)) {
      mesh.removePrimitive(prim)
      picked += 1
    }
  }
}
console.log('dropped meshes / primitives', dropped, 'picked primitives', picked)

// 2. texture sets replaced by another one (reuse.json: source diffuse → target diffuse). Every slot of the source
// materials takes the texture of the same slot of a target material and its alpha mode, the material keeps its
// factors and texture transforms
function slotsOf(mat) {
  const specular = mat.getExtension('KHR_materials_specular')
  return {
    baseColor: [() => mat.getBaseColorTexture(), (it) => mat.setBaseColorTexture(it)],
    normal: [() => mat.getNormalTexture(), (it) => mat.setNormalTexture(it)],
    metallicRoughness: [() => mat.getMetallicRoughnessTexture(), (it) => mat.setMetallicRoughnessTexture(it)],
    occlusion: [() => mat.getOcclusionTexture(), (it) => mat.setOcclusionTexture(it)],
    emissive: [() => mat.getEmissiveTexture(), (it) => mat.setEmissiveTexture(it)],
    specularColor: [() => specular?.getSpecularColorTexture() ?? null, (it) => specular?.setSpecularColorTexture(it)],
  }
}
let reused = 0
for (const [source, entry] of Object.entries(reuse)) {
  // "target diffuse" or { target, factors: true } (take the target's factors too)
  const target = typeof entry === 'string' ? entry : entry.target
  const copyFactors = typeof entry === 'object' && entry.factors === true
  const targetMat = root.listMaterials().find((it) => it.getBaseColorTexture()?.getName() === target)
  if (!targetMat) {
    console.log('reuse: no material with', target)
    continue
  }
  const targetSlots = slotsOf(targetMat)
  for (const mat of root.listMaterials()) {
    if (mat.getBaseColorTexture()?.getName() !== source) {
      continue
    }
    for (const [key, [, set]] of Object.entries(slotsOf(mat))) {
      set(targetSlots[key][0]())
    }
    // the alpha of the target textures follows the target's alpha mode
    mat.setAlphaMode(targetMat.getAlphaMode())
    mat.setAlphaCutoff(targetMat.getAlphaCutoff())
    reuseNwMaterial(mat, targetMat, copyFactors)
    reused += 1
    if (!copyFactors) {
      continue
    }
    // factors that belong to the textures (woodwall: a specular color factor of 25 scales its dark specular map);
    // tints stay with the material otherwise (the cloth colors are factors)
    mat.setBaseColorFactor(targetMat.getBaseColorFactor())
    mat.setRoughnessFactor(targetMat.getRoughnessFactor())
    mat.setMetallicFactor(targetMat.getMetallicFactor())
    mat.setEmissiveFactor(targetMat.getEmissiveFactor())
    const sourceSpecular = mat.getExtension('KHR_materials_specular')
    const targetSpecular = targetMat.getExtension('KHR_materials_specular')
    if (sourceSpecular && targetSpecular) {
      sourceSpecular.setSpecularFactor(targetSpecular.getSpecularFactor())
      sourceSpecular.setSpecularColorFactor(targetSpecular.getSpecularColorFactor())
    }
  }
}
console.log('reused texture sets (materials)', reused)

/**
 * The game material of a reused texture set: the target's textures, shader and parameters. The source keeps its
 * colors (the cloth tints), unless `copyFactors`
 */
function reuseNwMaterial(mat, targetMat, copyFactors) {
  const source = mat.getExtension(EXT_NW_MATERIAL)
  const target = targetMat.getExtension(EXT_NW_MATERIAL)
  if (!source || !target) {
    return
  }
  const data = JSON.parse(JSON.stringify(target.getData()))
  if (!copyFactors) {
    for (const key of ['Diffuse', 'Specular', 'Shininess', 'Emissive', 'Emittance']) {
      if (source.getData().attrs?.[key] !== undefined) {
        data.attrs[key] = source.getData().attrs[key]
      } else {
        delete data.attrs?.[key]
      }
    }
  }
  source.setData(data)
  source.copyTexturesFrom(target)
}

// 3. flat textures (rms deviation <= 3) become factors of the glTF material. The game material keeps them (the
// viewer renders it), they encode to almost nothing
const flat = new Map(similar.uniform.map((it) => [it.name, it.mean]))
let flattened = 0
for (const mat of root.listMaterials()) {
  const base = mat.getBaseColorTexture()
  if (base && flat.has(base.getName())) {
    const [r, g, b, a] = flat.get(base.getName())
    const f = mat.getBaseColorFactor()
    mat.setBaseColorFactor([f[0] * srgb(r), f[1] * srgb(g), f[2] * srgb(b), f[3] * (a / 255)])
    mat.setBaseColorTexture(null)
    flattened += 1
  }
  const mr = mat.getMetallicRoughnessTexture()
  if (mr && flat.has(mr.getName())) {
    const [, g, b] = flat.get(mr.getName())
    mat.setRoughnessFactor(mat.getRoughnessFactor() * (g / 255))
    mat.setMetallicFactor(mat.getMetallicFactor() * (b / 255))
    mat.setMetallicRoughnessTexture(null)
    flattened += 1
  }
  const normal = mat.getNormalTexture()
  if (normal && flat.has(normal.getName())) {
    // the only flat normal map is the engine's "replace me" placeholder
    mat.setNormalTexture(null)
    flattened += 1
  }
  const specular = mat.getExtension('KHR_materials_specular')
  const spec = specular?.getSpecularColorTexture()
  if (spec && flat.has(spec.getName())) {
    const [r, g, b] = flat.get(spec.getName())
    const f = specular.getSpecularColorFactor()
    specular.setSpecularColorFactor([f[0] * srgb(r), f[1] * srgb(g), f[2] * srgb(b)])
    specular.setSpecularColorTexture(null)
    flattened += 1
  }
}
console.log('flattened texture slots', flattened)

// 3b. lights that cannot reach the scene, hidden lights and lights without diffuse and specular. The game light
// (nwLight) is in the raw json, gltf-transform drops light extras.
// The scene is what the fixed camera sees: the surface points its rays hit (frame-points.json of blender_frame.py), a
// light has to reach one of them, spots within their cone.
const framePoints = [...readData('data/frame-points.json').points, ...characterPoints()]

/**
 * The character's volume is part of the scene too (its key and fill lights): a column of 0.4 m radius and 2 m
 * height at the character spot
 */
function characterPoints() {
  const [spotX, spotY, spotZ] = config.stage.spot
  const result = []
  for (let y = 0; y <= 2; y += 0.2) {
    for (const [dx, dz] of [
      [0, 0],
      [0.4, 0],
      [-0.4, 0],
      [0, 0.4],
      [0, -0.4],
    ]) {
      result.push([spotX + dx, spotY + y, spotZ + dz])
    }
  }
  return result
}
const reachesScene = (node, light) => {
  const range = light.getRange()
  if (!range) {
    return true
  }
  const position = node.getWorldTranslation()
  // spots shine along their local -Z
  const m = node.getWorldMatrix()
  const direction = [-m[8], -m[9], -m[10]]
  const length = Math.hypot(...direction) || 1
  // the points are cell centers of a 0.2 m grid: reach the cell, not only its center
  const reach = range + 0.2
  const cosCone = light.getType() === 'spot' ? Math.cos(light.getOuterConeAngle()) : -1
  return framePoints.some((p) => {
    const d = [p[0] - position[0], p[1] - position[1], p[2] - position[2]]
    const distance = Math.hypot(...d)
    if (distance > reach) {
      return false
    }
    if (distance < 0.3) {
      return true
    }
    return (d[0] * direction[0] + d[1] * direction[1] + d[2] * direction[2]) / (distance * length) >= cosCone
  })
}
let culled = 0
const culledLights = []
for (const node of root.listNodes()) {
  const light = node.getExtension('KHR_lights_punctual')
  if (!light) {
    continue
  }
  const rawLight =
    json.extensions?.KHR_lights_punctual?.lights?.[
      json.nodes[node.getExtras().sid]?.extensions?.KHR_lights_punctual?.light
    ]
  const game = rawLight?.extras?.nwLight
  const dark = game && !(game.diffuseMultiplier > 0) && !(game.specMultiplier > 0)
  const reason = cullReason(game, dark, node, light)
  if (reason) {
    culledLights.push({ name: node.getName(), reason, position: node.getWorldTranslation() })
    light.dispose()
    culled += 1
  }
}
// STAGE_CULL_LOG=<file>: the culled lights with the reason (hidden, dark, reach)
if (process.env.STAGE_CULL_LOG) {
  writeFileSync(process.env.STAGE_CULL_LOG, JSON.stringify(culledLights, null, 1))
}

// hidden lights go: the export applied the creation cutscene (nwbt --sequence), what is still hidden is off there
function cullReason(game, dark, node, light) {
  if (game?.hidden) {
    return 'hidden'
  }
  if (dark) {
    return 'dark'
  }
  if (!reachesScene(node, light)) {
    return 'reach'
  }
  return null
}
console.log('culled lights', culled)

// 3c. detail maps of close surfaces (config.details), the game's Illum detail mapping: the detail texture is one of the
// export
for (const entry of config.details) {
  const texture = root.listTextures().find((it) => it.getName().endsWith(`/${entry.detail}`))
  if (!texture) {
    throw new Error(`no texture ${entry.detail}`)
  }
  let count = 0
  for (const mat of root.listMaterials()) {
    const nw = mat.getExtension(EXT_NW_MATERIAL)
    const keys = nw?.listTextureKeys().filter((it) => it.startsWith('textures/')) || []
    const isTarget = keys.some((key) => {
      const map = nw.getTextureExtensions(key)?.EXT_nw_tex?.Map
      return map === 'Diffuse' && nw.getTexture(key).getName().endsWith(`/${entry.diffuse}`)
    })
    if (!isTarget) {
      continue
    }
    nw.setTexture(`textures/${keys.length}`, texture, {
      EXT_nw_tex: {
        File: texture.getName(),
        Map: 'Detail',
        TexMod: { TexMod_bTexGenProjected: 0, TileU: entry.tile[0], TileV: entry.tile[1] },
      },
    })
    const data = JSON.parse(JSON.stringify(nw.getData()))
    data.attrs.StringGenMask += '%DETAIL_MAPPING'
    data.params = {
      ...data.params,
      DetailBumpScale: String(entry.bump),
      DetailDiffuseScale: String(entry.color),
      DetailGlossScale: String(entry.gloss),
    }
    nw.setData(data)
    count += 1
  }
  console.log('detail', entry.detail, 'materials', count)
}

// 4. exact duplicates and unused data. The vertex attributes stay: the game materials use them, prune judges by the
// glTF material only (TEXCOORD_0 and TANGENT of materials whose glTF textures became factors). The game's time of
// day zones, fog volumes and env probes are empty nodes with their data in the extras (nwTimeOfDay, nwFogVolume,
// nwEnvProbe): prune removes empty leaves, they are added again after the last prune
const markers = root
  .listNodes()
  .filter((it) => it.getExtras().nwTimeOfDay || it.getExtras().nwFogVolume || it.getExtras().nwEnvProbe)
  .map((it) => ({ name: it.getName(), matrix: it.getWorldMatrix(), extras: it.getExtras() }))
console.log('markers', markers.length)
const pruneOptions = { keepAttributes: true, keepLeaves: false }
await doc.transform(dedup(), prune(pruneOptions))
// the extensions of removed materials (KHR_materials_specular) survive prune and keep their textures alive
const used = new Set(root.listMaterials().flatMap((it) => [...materialTextures(it), ...nwTextures(it)]))
for (const tex of root.listTextures()) {
  if (!used.has(tex)) {
    tex.dispose()
  }
}

await doc.transform(instance({ min: 2 }), prune(pruneOptions))

const scene = root.getDefaultScene() || root.listScenes()[0]
addLightBlockers()
// the time of day, fog volume and probe nodes, at the scene root with their world transform
for (const marker of markers) {
  scene.addChild(doc.createNode(marker.name).setMatrix(marker.matrix).setExtras(marker.extras))
}
// the stage description for the CharacterViewer (extras.nwStage, glTF coordinates): the character spot
// (Player_Entity_Int), the creation camera, the time of day of the character screen and the exposure the game's eye
// adaptation settles on there (EV 10, the minimum of the time of day: 1 / (1.2 · 2^10 / 10000))
scene.addChild(
  doc.createNode('Stage').setExtras({
    nwStage: config.stage,
  }),
)

await io.write(output, doc)
restoreLightExtras(json, output)
const textures = root.listTextures()
let bytes = 0
for (const tex of textures) {
  bytes += tex.getImage().byteLength
}
console.log(
  'out',
  output,
  'textures',
  textures.length,
  (bytes / 1e6).toFixed(1),
  'MB',
  'materials',
  root.listMaterials().length,
  'meshes',
  root.listMeshes().length,
  'nodes',
  root.listNodes().length,
)

function srgb(value) {
  const c = value / 255
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

function slotAccessors(mat) {
  if (!mat) {
    return []
  }
  const list = [
    [() => mat.getBaseColorTexture(), (it) => mat.setBaseColorTexture(it), 'srgb'],
    [() => mat.getNormalTexture(), (it) => mat.setNormalTexture(it), 'normal'],
    [() => mat.getMetallicRoughnessTexture(), (it) => mat.setMetallicRoughnessTexture(it), 'linear', 'low'],
    [() => mat.getOcclusionTexture(), (it) => mat.setOcclusionTexture(it), 'linear', 'low'],
    [() => mat.getEmissiveTexture(), (it) => mat.setEmissiveTexture(it), 'srgb'],
  ]
  const specular = mat.getExtension('KHR_materials_specular')
  if (specular) {
    list.push(
      [() => specular.getSpecularColorTexture(), (it) => specular.setSpecularColorTexture(it), 'srgb', 'low'],
      [() => specular.getSpecularTexture(), (it) => specular.setSpecularTexture(it), 'linear', 'low'],
    )
  }
  const transmission = mat.getExtension('KHR_materials_transmission')
  if (transmission) {
    list.push([() => transmission.getTransmissionTexture(), (it) => transmission.setTransmissionTexture(it), 'linear'])
  }
  return list
}

function materialTextures(mat) {
  return slotAccessors(mat)
    .map(([get]) => get())
    .filter((it) => !!it)
}

/**
 * Black two-sided walls beside the visible part of the ship (config.blockers): wide screens look past its trimmed ends
 */
function addLightBlockers() {
  const nw = doc.createExtension(NwMaterialExtension).createNwMaterial()
  nw.setData({
    attrs: {
      Name: 'light_blocker',
      Shader: 'Illum',
      StringGenMask: '',
      // MTL_FLAG_2SIDED
      MtlFlags: 2,
      Opacity: 1,
      Shininess: 0,
      Diffuse: [0, 0, 0, 1],
      Specular: [0, 0, 0, 0],
    },
    params: {},
  })
  const material = doc
    .createMaterial('light_blocker')
    .setDoubleSided(true)
    .setBaseColorFactor([0, 0, 0, 1])
    .setMetallicFactor(0)
    .setExtras({ nwBlocker: true })
    .setExtension(EXT_NW_MATERIAL, nw)
  const buffer = root.listBuffers()[0]
  const accessor = (type, array) => doc.createAccessor().setType(type).setArray(array).setBuffer(buffer)
  for (const { name, x, y, z } of config.blockers) {
    const corners = [
      [y[0], z[0]],
      [y[0], z[1]],
      [y[1], z[1]],
      [y[1], z[0]],
    ]
    const primitive = doc
      .createPrimitive()
      .setAttribute('POSITION', accessor('VEC3', new Float32Array(corners.flatMap((it) => [x, ...it]))))
      .setAttribute('NORMAL', accessor('VEC3', new Float32Array(corners.flatMap(() => [x < 0 ? 1 : -1, 0, 0]))))
      .setAttribute('TANGENT', accessor('VEC4', new Float32Array(corners.flatMap(() => [0, 0, 1, 1]))))
      .setAttribute('TEXCOORD_0', accessor('VEC2', new Float32Array([0, 0, 1, 0, 1, 1, 0, 1])))
      .setIndices(accessor('SCALAR', new Uint16Array([0, 1, 2, 0, 2, 3])))
      .setMaterial(material)
    scene.addChild(doc.createNode(name).setMesh(doc.createMesh(name).addPrimitive(primitive)))
  }
  console.log('light blockers', config.blockers.length)
}

/**
 * The textures of the game material (EXT_nw_material) of a material
 */
function nwTextures(mat) {
  const nw = mat?.getExtension(EXT_NW_MATERIAL)
  if (!nw) {
    return []
  }
  return nw
    .listTextureKeys()
    .map((key) => nw.getTexture(key))
    .filter((it) => !!it)
}
