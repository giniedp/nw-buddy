// What the editor camera sees of each material of the stage and which texture mip it needs. Software rasterizer:
// opaque depth first, then the pixels of every primitive in front of it. ids.png (default view, color = material) is
// written next to the analysis.
//   node tools/stage/analyze.mjs <stage.glb> <analysis.json>
import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { imageSize, readGlb } from './glb-json.mjs'

const sharp = createRequire(import.meta.url)('sharp')

const [FILE, OUTPUT] = process.argv.slice(2)
const HERE = dirname(OUTPUT)
const { json, bin } = readGlb(readFileSync(FILE))
const config = JSON.parse(readFileSync(new URL('config.json', import.meta.url), 'utf8'))

// the screen the densities are reported for; rasterized at half of it
const SCREEN = config.textures.screenHeight
const HEIGHT = SCREEN / 2
// the lowest, the default and the highest framing (character-viewer.ts DEFAULT_VIEW_LIMITS, look and height move
// together)
const FRAMINGS = [
  [0.6, -0.4],
  [1, 0],
  [1.7, 0.5],
]
const views = []
for (const zoom of [1, 2, 3]) {
  for (const [look, height] of FRAMINGS) {
    for (const orbit of [-8, 0, 8]) {
      views.push({ zoom, look, height, orbit, back: 0, aspect: 21 / 9 })
    }
  }
}
// zoomed out, up to the farthest distance (narrow canvases)
for (const back of [0.3, 1, 2]) {
  for (const [look, height] of FRAMINGS) {
    for (const orbit of [-8, 0, 8]) {
      views.push({ zoom: 0.7, look, height, orbit, back, aspect: 21 / 9 })
    }
  }
}
// what is seen at all: the whole trim, also what the controls do not reach (side shift, height apart from look)
for (const back of [0, 2]) {
  for (const look of [0.6, 1.1, 1.7]) {
    for (const height of [-0.4, 0, 0.5]) {
      for (const orbit of [-8, 8]) {
        for (const side of [0, 1]) {
          views.push({ zoom: 1, look, height, orbit, back, side, aspect: 21 / 9, sweep: true })
        }
      }
    }
  }
}

const COMPONENTS = {
  5120: [Int8Array, 127],
  5121: [Uint8Array, 255],
  5122: [Int16Array, 32767],
  5123: [Uint16Array, 65535],
  5125: [Uint32Array, 1],
  5126: [Float32Array, 1],
}
const SIZES = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 }

function accessor(index) {
  const acc = json.accessors[index]
  const view = json.bufferViews[acc.bufferView]
  const [Type, max] = COMPONENTS[acc.componentType]
  const size = SIZES[acc.type]
  const stride = view.byteStride || size * Type.BYTES_PER_ELEMENT
  const base = (view.byteOffset || 0) + (acc.byteOffset || 0)
  const out = acc.type === 'SCALAR' && !acc.normalized ? new Uint32Array(acc.count) : new Float32Array(acc.count * size)
  const data = new DataView(bin.buffer, bin.byteOffset, bin.byteLength)
  const read = {
    5120: 'getInt8',
    5121: 'getUint8',
    5122: 'getInt16',
    5123: 'getUint16',
    5125: 'getUint32',
    5126: 'getFloat32',
  }[acc.componentType]
  for (let i = 0; i < acc.count; i++) {
    for (let c = 0; c < size; c++) {
      const value = data[read](base + i * stride + c * Type.BYTES_PER_ELEMENT, true)
      out[i * size + c] = acc.normalized ? value / max : value
    }
  }
  return out
}

function imageInfo(textureIndex) {
  const tex = json.textures[textureIndex]
  const image = tex.extensions?.KHR_texture_basisu?.source ?? tex.source
  const view = json.bufferViews[json.images[image].bufferView]
  return {
    name: json.images[image].name,
    ...imageSize(bin.subarray(view.byteOffset || 0, (view.byteOffset || 0) + view.byteLength)),
  }
}

const materials = json.materials.map((mat, index) => {
  const nw = mat.extensions.EXT_nw_material
  const diffuse = (nw.textures || []).find((it) => it.extensions.EXT_nw_tex.Map === 'Diffuse')
  const info = diffuse ? imageInfo(diffuse.index) : null
  return {
    index,
    name: mat.name,
    shader: nw.attrs.Shader,
    opaque: (mat.alphaMode || 'OPAQUE') === 'OPAQUE',
    doubleSided: !!mat.doubleSided,
    volumetric: nw.attrs.Shader !== 'Illum',
    diffuse: info?.name,
    width: info?.width || 1,
    height: info?.height || 1,
    // pixel counts by lod bin (1/4 mip), per zoom
    hist: {},
    maxShare: 0,
    shareDefault: 0,
    triangles: 0,
    instances: 0,
    sources: new Set(),
  }
})

// instances: one entry per primitive and instance
const draws = []
function mul(a, b) {
  const out = new Array(16).fill(0)
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      for (let k = 0; k < 4; k++) {
        out[c * 4 + r] += a[k * 4 + r] * b[c * 4 + k]
      }
    }
  }
  return out
}
function compose(t = [0, 0, 0], q = [0, 0, 0, 1], s = [1, 1, 1]) {
  const [x, y, z, w] = q
  return [
    (1 - 2 * (y * y + z * z)) * s[0],
    2 * (x * y + z * w) * s[0],
    2 * (x * z - y * w) * s[0],
    0,
    2 * (x * y - z * w) * s[1],
    (1 - 2 * (x * x + z * z)) * s[1],
    2 * (y * z + x * w) * s[1],
    0,
    2 * (x * z + y * w) * s[2],
    2 * (y * z - x * w) * s[2],
    (1 - 2 * (x * x + y * y)) * s[2],
    0,
    t[0],
    t[1],
    t[2],
    1,
  ]
}
function determinant(m) {
  return m[0] * (m[5] * m[10] - m[6] * m[9]) - m[4] * (m[1] * m[10] - m[2] * m[9]) + m[8] * (m[1] * m[6] - m[2] * m[5])
}
const geometry = new Map()
function walk(index, parent) {
  const node = json.nodes[index]
  const world = mul(parent, node.matrix || compose(node.translation, node.rotation, node.scale))
  if (node.mesh != null) {
    const attrs = node.extensions?.EXT_mesh_gpu_instancing?.attributes
    const matrices = []
    if (attrs) {
      const t = attrs.TRANSLATION != null ? accessor(attrs.TRANSLATION) : null
      const r = attrs.ROTATION != null ? accessor(attrs.ROTATION) : null
      const s = attrs.SCALE != null ? accessor(attrs.SCALE) : null
      const count = json.accessors[attrs.TRANSLATION ?? attrs.ROTATION ?? attrs.SCALE].count
      for (let i = 0; i < count; i++) {
        matrices.push(
          mul(world, compose(t?.slice(i * 3, i * 3 + 3), r?.slice(i * 4, i * 4 + 4), s?.slice(i * 3, i * 3 + 3))),
        )
      }
    } else {
      matrices.push(world)
    }
    json.meshes[node.mesh].primitives.forEach((prim, primIndex) => {
      const key = `${node.mesh}:${primIndex}`
      if (!geometry.has(key)) {
        geometry.set(key, {
          key,
          source: prim.extras?.source || json.meshes[node.mesh].name,
          position: accessor(prim.attributes.POSITION),
          uv: accessor(prim.attributes.TEXCOORD_0),
          indices: accessor(prim.indices),
          bytes: [prim.indices, ...Object.values(prim.attributes)].reduce((sum, it) => sum + accessorBytes(it), 0),
          maxShare: 0,
        })
      }
      const geo = geometry.get(key)
      geo.material = prim.material
      const mat = materials[prim.material]
      mat.triangles += (geo.indices.length / 3) * matrices.length
      mat.instances += matrices.length
      mat.sources.add(geo.source)
      for (const matrix of matrices) {
        draws.push({ geo, matrix, mat, winding: Math.sign(determinant(matrix)), maxShare: 0 })
      }
    })
  }
  for (const child of node.children || []) {
    walk(child, world)
  }
}
function accessorBytes(index) {
  const acc = json.accessors[index]
  return acc.count * SIZES[acc.type] * COMPONENTS[acc.componentType][0].BYTES_PER_ELEMENT
}
const IDENTITY = compose()
json.scenes[json.scene || 0].nodes.forEach((it) => walk(it, IDENTITY))

const stage = json.nodes.find((it) => it.extras?.nwStage).extras.nwStage
const sub = (a, b) => a.map((v, i) => v - b[i])
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const norm = (a) => a.map((v) => v / Math.hypot(...a))
const UP = [0, 1, 0]

function camera(view) {
  const flat = sub(stage.spot, stage.camera)
  flat[1] = 0
  const forward = norm(flat)
  let eye = stage.camera.map((v, i) => v - forward[i] * view.back + UP[i] * view.height)
  const left = cross(UP, forward)
  let target = stage.spot.map((v, i) => v + UP[i] * view.look + left[i] * (view.side || 0))
  const a = (view.orbit * Math.PI) / 180
  const d = sub(eye, stage.spot)
  eye = [
    stage.spot[0] + d[0] * Math.cos(a) + d[2] * Math.sin(a),
    eye[1],
    stage.spot[2] - d[0] * Math.sin(a) + d[2] * Math.cos(a),
  ]
  const dir = norm(sub(target, eye))
  const right = norm(cross(dir, UP))
  const up = cross(right, dir)
  return { eye, dir, right, up, tan: Math.tan((25 * Math.PI) / 180) / Math.max(view.zoom, 1) }
}

const NEAR = 0.05

function raster(view, pass, depth, onPixel) {
  const width = Math.round(HEIGHT * view.aspect)
  const cam = camera(view)
  const focal = HEIGHT / 2 / cam.tan
  let projected = new Float32Array(0)
  for (const draw of draws) {
    if (pass === 0 ? !draw.mat.opaque : false) {
      continue
    }
    const { position, uv, indices } = draw.geo
    const m = draw.matrix
    const count = position.length / 3
    if (projected.length < count * 3) {
      projected = new Float32Array(count * 3)
    }
    let visible = false
    for (let i = 0; i < count; i++) {
      const x = position[i * 3]
      const y = position[i * 3 + 1]
      const z = position[i * 3 + 2]
      const wx = m[0] * x + m[4] * y + m[8] * z + m[12] - cam.eye[0]
      const wy = m[1] * x + m[5] * y + m[9] * z + m[13] - cam.eye[1]
      const wz = m[2] * x + m[6] * y + m[10] * z + m[14] - cam.eye[2]
      projected[i * 3] = wx * cam.right[0] + wy * cam.right[1] + wz * cam.right[2]
      projected[i * 3 + 1] = wx * cam.up[0] + wy * cam.up[1] + wz * cam.up[2]
      const w = wx * cam.dir[0] + wy * cam.dir[1] + wz * cam.dir[2]
      projected[i * 3 + 2] = w
      visible ||= w > NEAR
    }
    if (!visible) {
      continue
    }
    for (let t = 0; t < indices.length; t += 3) {
      const poly = []
      for (let k = 0; k < 3; k++) {
        const i = indices[t + k]
        poly.push([projected[i * 3], projected[i * 3 + 1], projected[i * 3 + 2], uv[i * 2], uv[i * 2 + 1]])
      }
      const behind = poly.filter((it) => it[2] <= NEAR).length
      if (behind === 3) {
        continue
      }
      const clipped = behind ? clipNear(poly) : poly
      for (let k = 2; k < clipped.length; k++) {
        triangle(clipped[0], clipped[k - 1], clipped[k], draw)
      }
    }
  }

  function triangle(a, b, c, draw) {
    const ax = width / 2 + (a[0] / a[2]) * focal
    const ay = HEIGHT / 2 - (a[1] / a[2]) * focal
    const bx = width / 2 + (b[0] / b[2]) * focal
    const by = HEIGHT / 2 - (b[1] / b[2]) * focal
    const cx = width / 2 + (c[0] / c[2]) * focal
    const cy = HEIGHT / 2 - (c[1] / c[2]) * focal
    const minX = Math.max(0, Math.ceil(Math.min(ax, bx, cx) - 0.5))
    const maxX = Math.min(width - 1, Math.floor(Math.max(ax, bx, cx) - 0.5))
    const minY = Math.max(0, Math.ceil(Math.min(ay, by, cy) - 0.5))
    const maxY = Math.min(HEIGHT - 1, Math.floor(Math.max(ay, by, cy) - 0.5))
    if (minX > maxX || minY > maxY) {
      return
    }
    const area = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax)
    if (Math.abs(area) < 1e-9) {
      return
    }
    // front faces are counterclockwise (screen y points down), mirrored instances clockwise
    if (!draw.mat.doubleSided && area * draw.winding > 0) {
      return
    }
    const inv = 1 / area
    const ia = 1 / a[2]
    const ib = 1 / b[2]
    const ic = 1 / c[2]
    // barycentric gradients
    const dbx = (cy - ay) * inv
    const dby = -(cx - ax) * inv
    const dcx = -(by - ay) * inv
    const dcy = (bx - ax) * inv
    const gradient = (fa, fb, fc) => [(fb - fa) * dbx + (fc - fa) * dcx, (fb - fa) * dby + (fc - fa) * dcy]
    const gw = gradient(ia, ib, ic)
    const gu = gradient(a[3] * ia, b[3] * ib, c[3] * ic)
    const gv = gradient(a[4] * ia, b[4] * ib, c[4] * ic)
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const px = x + 0.5 - ax
        const py = y + 0.5 - ay
        const lb = px * dbx + py * dby
        const lc = px * dcx + py * dcy
        if (lb < 0 || lc < 0 || lb + lc > 1) {
          continue
        }
        const w = ia + px * gw[0] + py * gw[1]
        const at = y * width + x
        if (pass === 0) {
          if (w > depth[at]) {
            depth[at] = w
          }
          continue
        }
        if (w < depth[at] * 0.9995) {
          continue
        }
        const z = 1 / w
        const u = (a[3] * ia + px * gu[0] + py * gu[1]) * z
        const v = (a[4] * ia + px * gv[0] + py * gv[1]) * z
        onPixel(
          draw,
          at,
          (gu[0] - u * gw[0]) * z,
          (gu[1] - u * gw[1]) * z,
          (gv[0] - v * gw[0]) * z,
          (gv[1] - v * gw[1]) * z,
        )
      }
    }
  }
}

function clipNear(poly) {
  const out = []
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i]
    const b = poly[(i + 1) % poly.length]
    if (a[2] > NEAR) {
      out.push(a)
    }
    if (a[2] > NEAR !== b[2] > NEAR) {
      const t = (NEAR - a[2]) / (b[2] - a[2])
      out.push(a.map((v, k) => v + (b[k] - v) * t))
    }
  }
  return out
}

for (const view of views) {
  const width = Math.round(HEIGHT * view.aspect)
  const depth = new Float32Array(width * HEIGHT)
  raster(view, 0, depth)
  const counts = new Map()
  const drawCounts = new Map()
  const scale = HEIGHT / SCREEN
  const isDefault = view.zoom === 1 && view.look === 1 && view.orbit === 0
  const ids = isDefault ? Buffer.alloc(width * HEIGHT * 3) : null
  raster(view, 1, depth, (draw, at, ux, uy, vx, vy) => {
    const mat = draw.mat
    if (ids && !mat.volumetric) {
      ids[at * 3] = (mat.index * 67 + 40) % 256
      ids[at * 3 + 1] = (mat.index * 131 + 90) % 256
      ids[at * 3 + 2] = (mat.index * 29 + 140) % 256
    }
    counts.set(mat, (counts.get(mat) || 0) + 1)
    drawCounts.set(draw, (drawCounts.get(draw) || 0) + 1)
    // texels per screen pixel along the less dense axis: anisotropic filtering takes this one's mip
    const a = ux * mat.width * scale
    const b = uy * mat.width * scale
    const c = vx * mat.height * scale
    const d = vy * mat.height * scale
    const e = (a * a + b * b + c * c + d * d) / 2
    const f = Math.sqrt(Math.max(0, e * e - (a * d - b * c) ** 2))
    const major = Math.sqrt(e + f)
    const minor = Math.max(Math.sqrt(Math.max(0, e - f)), major / 8)
    const lod = minor > 0 ? Math.log2(minor) : 10
    const bin = Math.max(-40, Math.min(40, Math.floor(lod * 4)))
    if (view.sweep) {
      return
    }
    const hist = (mat.hist[view.zoom] ||= {})
    hist[bin] = (hist[bin] || 0) + 1
  })
  if (ids) {
    await sharp(ids, { raw: { width, height: HEIGHT, channels: 3 } })
      .png()
      .toFile(join(HERE, 'ids.png'))
  }
  const total = width * HEIGHT
  for (const [mat, count] of counts) {
    mat.seenPixels = Math.max(mat.seenPixels || 0, count)
    if (view.sweep) {
      continue
    }
    mat.maxShare = Math.max(mat.maxShare, count / total)
    if (view.zoom === 1 && view.look === 1 && view.orbit === 0) {
      mat.shareDefault = count / total
    }
  }
  for (const [draw, count] of drawCounts) {
    draw.maxShare = Math.max(draw.maxShare, count / total)
    draw.geo.maxShare = Math.max(draw.geo.maxShare, count / total)
  }
  console.error('view', JSON.stringify(view))
}

function percentile(hist, p) {
  const bins = Object.entries(hist || {})
    .map(([k, v]) => [Number(k), v])
    .sort((x, y) => x[0] - y[0])
  const total = bins.reduce((sum, it) => sum + it[1], 0)
  let sum = 0
  for (const [bin, count] of bins) {
    sum += count
    if (sum >= total * p) {
      return bin / 4
    }
  }
  return null
}

const result = {
  materials: materials.map((it) => ({
    ...it,
    hist: undefined,
    sources: [...it.sources],
    // the mip of the diffuse that the 5 % most magnified pixels take (0: full size, 1: half is enough)
    lodOut: percentile(it.hist[0.7], 0.05),
    lod1: percentile(it.hist[1], 0.05),
    lod2: percentile(it.hist[2], 0.05),
    lod3: percentile(it.hist[3], 0.05),
    median1: percentile(it.hist[1], 0.5),
    median3: percentile(it.hist[3], 0.5),
  })),
  geometries: [...geometry.values()].map((it) => ({
    key: it.key,
    source: it.source,
    material: it.material,
    bytes: it.bytes,
    triangles: it.indices.length / 3,
    maxShare: it.maxShare,
    instances: draws.filter((d) => d.geo === it).length,
    unseenInstances: draws.filter((d) => d.geo === it && d.maxShare === 0).length,
  })),
}
writeFileSync(OUTPUT, JSON.stringify(result, null, 1))
