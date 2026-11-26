// The JSON chunk of a glb file
import { readFileSync, writeFileSync } from 'node:fs'

export function readGlbJson(file) {
  const data = readFileSync(file)
  const length = data.readUInt32LE(12)
  return JSON.parse(data.subarray(20, 20 + length).toString('utf8'))
}

/**
 * The JSON and the BIN chunk of a glb file
 */
export function readGlb(data) {
  const jsonLength = data.readUInt32LE(12)
  const json = JSON.parse(data.subarray(20, 20 + jsonLength).toString('utf8'))
  const binStart = 20 + jsonLength
  if (binStart >= data.length) {
    return { json, bin: Buffer.alloc(0) }
  }
  const binLength = data.readUInt32LE(binStart)
  if (data.readUInt32LE(binStart + 4) !== 0x004e4942) {
    throw new Error('the second chunk is not BIN')
  }
  return { json, bin: data.subarray(binStart + 8, binStart + 8 + binLength) }
}

/**
 * The size in pixels of a PNG or KTX2 file
 */
export function imageSize(data) {
  if (data.readUInt32BE(0) === 0x89504e47) {
    return { width: data.readUInt32BE(16), height: data.readUInt32BE(20) }
  }
  if (data.subarray(1, 7).toString('latin1') === 'KTX 20') {
    return { width: data.readUInt32LE(20), height: data.readUInt32LE(24) }
  }
  throw new Error('neither PNG nor KTX2')
}

/**
 * A glb file of a JSON and a BIN chunk. Chunks are 4 byte aligned: JSON pads with spaces, BIN with zeros.
 */
export function writeGlb(json, bin) {
  const text = pad(Buffer.from(JSON.stringify(json), 'utf8'), 0x20)
  const body = pad(bin, 0)
  const header = Buffer.alloc(20)
  header.writeUInt32LE(0x46546c67, 0) // glTF
  header.writeUInt32LE(2, 4)
  header.writeUInt32LE(20 + text.length + 8 + body.length, 8)
  header.writeUInt32LE(text.length, 12)
  header.writeUInt32LE(0x4e4f534a, 16) // JSON
  const binHeader = Buffer.alloc(8)
  binHeader.writeUInt32LE(body.length, 0)
  binHeader.writeUInt32LE(0x004e4942, 4) // BIN
  return Buffer.concat([header, text, binHeader, body])
}

/**
 * Appends raw KTX2 files (not Basis, so no KHR_texture_basisu) to the BIN chunk as images with a texture each. No
 * material uses them. Returns the chunks for {@link writeGlb} and the texture index of each file by name.
 */
export function embedKtx2Textures(data, files) {
  const { json, bin } = readGlb(data)
  const parts = [bin]
  let length = bin.length
  const indices = new Map()
  json.bufferViews ||= []
  json.images ||= []
  json.textures ||= []
  for (const { name, data: file } of files) {
    const padding = (4 - (length % 4)) % 4
    parts.push(Buffer.alloc(padding))
    length += padding
    json.bufferViews.push({ buffer: 0, byteOffset: length, byteLength: file.length })
    parts.push(file)
    length += file.length
    json.images.push({ name, mimeType: 'image/ktx2', bufferView: json.bufferViews.length - 1 })
    json.textures.push({ name, source: json.images.length - 1 })
    indices.set(name, json.textures.length - 1)
  }
  json.buffers[0].byteLength = length
  return { json, bin: Buffer.concat(parts), indices }
}

function pad(buffer, value) {
  const padding = (4 - (buffer.length % 4)) % 4
  return padding ? Buffer.concat([buffer, Buffer.alloc(padding, value)]) : buffer
}

/**
 * gltf-transform drops the extras of KHR_lights_punctual lights, nwbt keeps the game's light in them (`nwLight`).
 * Copies them back through the light's node: its `extras.sid` (process.mjs) is the node index of the input, whose
 * light has the extras. Rewrites the JSON chunk of the glb.
 */
export function restoreLightExtras(inputJson, file) {
  const source = inputJson.extensions?.KHR_lights_punctual?.lights || []
  if (!source.some((it) => it.extras)) {
    return
  }
  const data = readFileSync(file)
  const jsonLength = data.readUInt32LE(12)
  const json = JSON.parse(data.subarray(20, 20 + jsonLength).toString('utf8'))
  const target = json.extensions?.KHR_lights_punctual?.lights || []
  let restored = 0
  for (const node of json.nodes || []) {
    const index = node.extensions?.KHR_lights_punctual?.light
    if (index == null) {
      continue
    }
    const sourceNode = inputJson.nodes[node.extras?.sid]
    const sourceLight = source[sourceNode?.extensions?.KHR_lights_punctual?.light]
    if (!sourceLight || (sourceLight.name || '') !== (target[index].name || '')) {
      throw new Error(`no source light for node ${node.name} (sid ${node.extras?.sid})`)
    }
    if (sourceLight.extras) {
      target[index].extras = sourceLight.extras
      restored += 1
    }
  }
  let text = Buffer.from(JSON.stringify(json), 'utf8')
  // chunks are 4 byte aligned, the JSON chunk pads with spaces
  const padding = (4 - (text.length % 4)) % 4
  text = Buffer.concat([text, Buffer.alloc(padding, 0x20)])
  const rest = data.subarray(20 + jsonLength)
  const header = Buffer.alloc(20)
  header.writeUInt32LE(0x46546c67, 0) // glTF
  header.writeUInt32LE(2, 4)
  header.writeUInt32LE(20 + text.length + rest.length, 8)
  header.writeUInt32LE(text.length, 12)
  header.writeUInt32LE(0x4e4f534a, 16) // JSON
  writeFileSync(file, Buffer.concat([header, text, rest]))
  console.log('light extras restored', restored, 'of', target.length)
}
