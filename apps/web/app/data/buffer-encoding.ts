import { base64ToBuffer, bufferToBase64 } from '~/utils/buffer-utils'

export const TYPED_ARRAYS = {
  Int8Array: Int8Array,
  Uint8Array: Uint8Array,
  Uint8ClampedArray: Uint8ClampedArray,
  Int16Array: Int16Array,
  Uint16Array: Uint16Array,
  Int32Array: Int32Array,
  Uint32Array: Uint32Array,
  Float32Array: Float32Array,
  Float64Array: Float64Array,
} as const

export interface EncodedBuffer {
  _type: 'ArrayBuffer' | keyof typeof TYPED_ARRAYS
  _data: string
}

export async function recursivelyEncodeArrayBuffers(data: any) {
  if (!data || typeof data !== 'object') {
    return
  }
  if (Array.isArray(data)) {
    for (const item of data) {
      await recursivelyEncodeArrayBuffers(item)
    }
    return
  }
  for (const key in data) {
    if (isEncodableBuffer(data[key])) {
      data[key] = await encodeBuffer(data[key])
      // console.debug('encoded', data)
    } else {
      await recursivelyEncodeArrayBuffers(data[key])
    }
  }
}

export async function recursivelyDecodeArrayBuffers(data: any) {
  if (!data || typeof data !== 'object') {
    return
  }
  if (Array.isArray(data)) {
    for (const item of data) {
      await recursivelyDecodeArrayBuffers(item)
    }
    return
  }
  for (const key in data) {
    if (isDecodableBuffer(data[key])) {
      data[key] = await decodeBuffer(data[key])
      // console.debug('decoded', data)
    } else {
      await recursivelyDecodeArrayBuffers(data[key])
    }
  }
}

function isEncodableBuffer(it: unknown): it is ArrayBuffer | ArrayBufferView {
  if (!it) {
    return false
  }
  if (it instanceof ArrayBuffer) {
    return true
  }
  const buffer = it['buffer']
  if (!ArrayBuffer.isView(buffer)) {
    return false
  }
  for (const type of Object.values(TYPED_ARRAYS)) {
    if (buffer instanceof type) {
      return true
    }
  }
  return false
}

function isDecodableBuffer(it: unknown): it is EncodedBuffer {
  if (!it) {
    return false
  }
  const res = it as EncodedBuffer
  if (!res._data || !res._type) {
    return false
  }
  if (res._type === 'ArrayBuffer') {
    return true
  }
  return res._type in TYPED_ARRAYS
}

async function encodeBuffer(it: ArrayBuffer | ArrayBufferView): Promise<EncodedBuffer> {
  if (it instanceof ArrayBuffer) {
    return {
      _type: 'ArrayBuffer',
      _data: await bufferToBase64(it),
    }
  }
  for (const [typeName, type] of Object.entries(TYPED_ARRAYS)) {
    if (it instanceof type) {
      const buffer = it.buffer.slice(it.byteOffset, it.byteOffset + it.byteLength)
      const data = await bufferToBase64(buffer as ArrayBuffer)
      return {
        _type: typeName as any,
        _data: data,
      }
    }
  }
  return null
}

async function decodeBuffer(it: EncodedBuffer): Promise<ArrayBuffer | ArrayBufferView> {
  const buffer = await base64ToBuffer(it._data)
  if (it._type === 'ArrayBuffer') {
    return buffer
  }
  const type = TYPED_ARRAYS[it._type]
  if (type) {
    return new type(buffer)
  }
  return null
}
